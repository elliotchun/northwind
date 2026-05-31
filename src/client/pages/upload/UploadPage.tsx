import { useState, type FormEvent, useEffect } from "react"
import { Box, Text, Button, Input, VStack, Heading, Alert, Textarea, HStack } from "@chakra-ui/react"
import { toaster, Toaster } from "../../../components/ui/toaster"

interface Employee {
  _id: string
  name: string
}

export function UploadPage() {
  const [isUploading, setIsUploading] = useState(false)
  const [ocrResults, setOcrResults] = useState<Array<{ name: string; text: string }>>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("")
  const [saveLoading, setSaveLoading] = useState(false)

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
      setOcrResults(data.results || [])
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

      setOcrResults([])
      setSelectedEmployeeId("")
    } catch (err) {
      toaster.create({ title: "Error", description: String(err), duration: 5000 })
    } finally {
      setSaveLoading(false)
    }
  }

  return (
    <Box p={6} maxWidth="800px" mx="auto">
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
            Upload and OCR
          </Button>
        </form>

        {employees.length > 0 && (
          <VStack align="stretch" gap={2}>
            <Text fontWeight="bold">Assign to employee (optional):</Text>
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

        {ocrResults.length > 0 && (
          <VStack align="stretch" gap={4}>
            <HStack justify="space-between">
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
            </HStack>

            {ocrResults.map((result, idx) => (
              <Box key={idx} borderWidth={1} borderRadius="md" p={3}>
                <Text fontWeight="bold" mb={2}>
                  {result.name}
                </Text>
                <Textarea
                  value={result.text}
                  readOnly
                  minHeight="150px"
                  bg="gray.50"
                  _dark={{ bg: "gray.700" }}
                  fontSize="sm"
                />
              </Box>
            ))}
          </VStack>
        )}
        <Toaster />
      </VStack>
    </Box>
  )
}
