import { useEffect, useState } from "react"
import { Box, Text, Spinner, Heading } from "@chakra-ui/react"

interface EmployeeDoc {
  _id: string
  employee_id: string
  name: string
  grade: number
  title: string
  department: string
  home_base: string
}

export function EmployeePage() {
  const [emp, setEmp] = useState<EmployeeDoc | null>(null)
  const [loading, setLoading] = useState(true)

  const id = window.location.pathname.split("/").pop()!

  useEffect(() => {
    fetch(`api/employees/${id}`)
      .then(res => res.json())
      .then(data => {
        setEmp(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  return (
    <Box p={4}>
      <Heading size="md" mb={4}>
        Employee Details
      </Heading>
      {loading ? (
        <Spinner />
      ) : emp ? (
        <Box maxW="md">
          <Text mb={2}><strong>ID:</strong> {emp.employee_id}</Text>
          <Text mb={2}><strong>Name:</strong> {emp.name}</Text>
          <Text mb={2}><strong>Grade:</strong> {emp.grade}</Text>
          <Text mb={2}><strong>Title:</strong> {emp.title}</Text>
          <Text mb={2}><strong>Department:</strong> {emp.department}</Text>
          <Text mb={2}><strong>Home Base:</strong> {emp.home_base}</Text>
        </Box>
      ) : (
        <Text>Employee not found</Text>
      )}
    </Box>
  )
}
