import { useState, type FormEvent, useEffect } from "react"
import { Box, Text, Button, Input, VStack, Heading, Textarea, HStack } from "@chakra-ui/react"
import { toaster, Toaster } from "../../../components/ui/toaster"

interface Employee {
  _id: string
  name: string
}

interface LineItem {
  _id: string
  item_name: string
  spending_category: string
  verdict: "accepted" | "rejected"
  reason: string
  confidence: -1 | 0 | 1
}

interface OCRResult {
  name: string
  text: string
  receiptId?: string
}

let lineItemIdCounter = 0

function newLineItem(): LineItem {
  return {
    _id: `li-${lineItemIdCounter++}`,
    item_name: "",
    spending_category: "",
    verdict: "accepted",
    reason: "",
    confidence: 0,
  }
}

export function UploadPage() {
  const [isUploading, setIsUploading] = useState(false)
  const [ocrResults, setOcrResults] = useState<OCRResult[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("")
  const [saveLoading, setSaveLoading] = useState(false)
  const [claimSaving, setClaimSaving] = useState(false)
  const [lineItems, setLineItems] = useState<LineItem[]>([])

  useEffect(() => {
    fetch("/api/employees")
      .then((r) => r.json())
      .then(setEmployees)
  }, [])

  const handleUpload = async (e: SubmitEvent) => {
    e.preventDefault()
    setIsUploading(true)
    setOcrResults([])

    const formData = new FormData(e.currentTarget)

    try {
      const response = await fetch("/api/vision", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to process files")
      }

      const data = await response.json()
      setOcrResults((data.results || []).map((r: { name: string; text: string }) => ({ ...r })))
    } catch (err) {
      toaster.create({ title: "Error", description: String(err), duration: 5000 })
    } finally {
      setIsUploading(false)
    }
  }

  const handleSave = async () => {
    if (ocrResults.length === 0) return

    setSaveLoading(true)

    try {
      const payload = {
        employeeId: selectedEmployeeId || undefined,
        text: ocrResults.flatMap((r) => r.text.split("\n").map((l) => l.trim()).filter((l) => l.length > 0)),
      }

      const response = await fetch("/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error("Failed to save receipt")
      }

      const savedReceipts = await response.json()
      const receiptId = Array.isArray(savedReceipts) ? savedReceipts[0]?._id : savedReceipts?._id
      setOcrResults(prev => prev.map((r, i) => ({ ...r, receiptId })))
      setOcrResults([])
      setSelectedEmployeeId("")
    } catch (err) {
      toaster.create({ title: "Error", description: String(err), duration: 5000 })
    } finally {
      setSaveLoading(false)
    }
  }

  const handleSaveClaim = async () => {
    if (lineItems.length === 0) {
      toaster.create({ title: "Error", description: "No line items to submit", duration: 5000 })
      return
    }

    let receiptIds = ocrResults
      .filter(r => r.receiptId)
      .map(r => r.receiptId!)

    // Auto-create receipts if none saved yet
    if (receiptIds.length === 0 && ocrResults.length > 0) {
      const payload = {
        text: ocrResults.flatMap((r) => r.text.split("\n").map((l) => l.trim()).filter((l) => l.length > 0)),
      }
      const response = await fetch("/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        throw new Error("Failed to auto-create receipts")
      }
      const savedReceipts = await response.json()
      receiptIds = Array.isArray(savedReceipts) ? savedReceipts.map((r: { _id: string }) => r._id) : [savedReceipts._id]
    }

    setClaimSaving(true)

    try {
      const response = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiptIds, lineItems: lineItems.map(({ _id, ...rest }) => rest) }),
      })

      if (!response.ok) {
        throw new Error("Failed to save claim")
      }

      toaster.create({ title: "Success", description: "Claim saved successfully", duration: 5000 })
      setOcrResults([])
      setLineItems([])
    } catch (err) {
      toaster.create({ title: "Error", description: String(err), duration: 5000 })
    } finally {
      setClaimSaving(false)
    }
  }

  const addLineItem = () => {
    setLineItems(prev => [...prev, newLineItem()])
  }

  const removeLineItem = (id: string) => {
    setLineItems(prev => prev.filter(item => item._id !== id))
  }

  const updateLineItem = (id: string, field: string, value: string | "accepted" | "rejected" | -1 | 0 | 1) => {
    setLineItems(prev => prev.map(item => item._id === id ? { ...item, [field]: value } : item))
  }

  return (
    <Box p={6} maxWidth="1000px" mx="auto">
      <VStack gap={6} align="stretch">
        <Heading size="md">Upload Receipts</Heading>

        <form onSubmit={handleUpload}>
          <Input
            type="file"
            name="files"
            accept="image/*,application/pdf,.txt,.md"
            multiple
          />
          <Button
            type="submit"
            colorScheme="blue"
            mt={4}
            loading={isUploading}
            loadingText="Processing..."
          >
            Upload
          </Button>
        </form>

        {ocrResults.length > 0 && (
          <VStack align="stretch" gap={4}>
            <HStack justify="space-between" wrap="wrap">
              {employees.length > 0 && (
                <VStack align="stretch" gap={2}>
                  <Text fontWeight="bold">Assign to employee:</Text>
                  <select
                    value={selectedEmployeeId}
                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                    style={{ width: "100%", padding: 8, borderRadius: 4 }}
                  >
                    <option value="">-- Select employee --</option>
                    {employees.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.name}
                      </option>
                    ))}
                  </select>
                </VStack>
              )}
              <HStack gap={3}>
                <Text fontWeight="bold">OCR Results ({ocrResults.length} file(s))</Text>
                <Button
                  colorScheme="green"
                  size="sm"
                  onClick={handleSave}
                  loading={saveLoading}
                  loadingText="Saving..."
                >
                  Save to DB
                </Button>
                <Button
                  colorScheme="purple"
                  size="sm"
                  onClick={handleSaveClaim}
                  loading={claimSaving}
                  loadingText="Saving Claim..."
                >
                  Save Claim
                </Button>
              </HStack>
            </HStack>

            {ocrResults.map((result, idx) => (
              <Box key={idx} borderWidth={1} borderRadius="md" p={3}>
                <HStack justify="space-between" mb={2}>
                  <Text fontWeight="bold">{result.name}</Text>
                  {result.receiptId && <Text fontSize="xs" color="gray.500">Receipt: {result.receiptId}</Text>}
                </HStack>
                <Textarea
                  value={result.text}
                  readOnly
                  minHeight="100px"
                  bg="gray.50"
                  _dark={{ bg: "gray.700" }}
                  fontSize="sm"
                  mb={3}
                />
              </Box>
            ))}

            <Button
              size="sm"
              variant="outline"
              onClick={addLineItem}
            >
              + Add Line Item
            </Button>
            {lineItems.length > 0 && (
              <Box>
                <HStack justify="space-between" mb={2}>
                  <Text fontWeight="bold">Line Items ({lineItems.length})</Text>
                  <Text fontSize="sm" color="gray.500">Edit line items below, then click "Save Claim"</Text>
                </HStack>
                <VStack align="stretch" gap={3}>
                  {lineItems.map((item) => {
                    return (
                      <Box key={item._id} borderWidth={1} borderRadius="sm" p={3} bg="white" _dark={{ bg: "gray.800" }}>
                        <HStack gap={2}>
                          <Input
                            placeholder="Item name"
                            value={item.item_name}
                            onChange={(e) => updateLineItem(item._id, "item_name", e.target.value)}
                            fontSize="sm"
                            size="sm"
                            flex={1}
                          />
                          <Input
                            placeholder="Category"
                            value={item.spending_category}
                            onChange={(e) => updateLineItem(item._id, "spending_category", e.target.value)}
                            fontSize="sm"
                            size="sm"
                            flex={1}
                          />
                          <select
                            value={item.verdict}
                            onChange={(e) => updateLineItem(item._id, "verdict", e.target.value as "accepted" | "rejected")}
                            style={{ padding: 4, borderRadius: 4, fontSize: "sm" }}
                          >
                            <option value="accepted">Accepted</option>
                            <option value="rejected">Rejected</option>
                          </select>
                          <select
                            value={item.confidence}
                            onChange={(e) => updateLineItem(item._id, "confidence", Number(e.target.value) as -1 | 0 | 1)}
                            style={{ padding: 4, borderRadius: 4, fontSize: "sm" }}
                          >
                            <option value={-1}>-1</option>
                            <option value={0}>0</option>
                            <option value={1}>1</option>
                          </select>
                          <Input
                            placeholder="Reason"
                            value={item.reason}
                            onChange={(e) => updateLineItem(item._id, "reason", e.target.value)}
                            fontSize="sm"
                            size="sm"
                            flex={1}
                          />
                          <Button
                            size="xs"
                            colorScheme="red"
                            variant="ghost"
                            onClick={() => removeLineItem(item._id)}
                          >
                            ✕
                          </Button>
                        </HStack>
                      </Box>
                    )
                  })}
                </VStack>
              </Box>
            )}
          </VStack>
        )}
        <Toaster />
      </VStack>
    </Box>
  )
}
