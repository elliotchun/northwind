import { useEffect, useState } from "react"
import { Box, Table, Spinner, Heading, Link } from "@chakra-ui/react"
import type { EmployeeDoc } from "../../../models/employee"

export function EmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeDoc[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("api/employees")
      .then(res => res.json())
      .then(data => {
        setEmployees(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <Box p={4}>
      <Heading size="md" mb={4}>
        Employees
      </Heading>
      {loading ? (
        <Spinner />
      ) : (
        <Table.Root size="sm">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>ID</Table.ColumnHeader>
              <Table.ColumnHeader>Name</Table.ColumnHeader>
              <Table.ColumnHeader>Grade</Table.ColumnHeader>
              <Table.ColumnHeader>Title</Table.ColumnHeader>
              <Table.ColumnHeader>Department</Table.ColumnHeader>
              <Table.ColumnHeader>Home Base</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {employees.map(emp => (
              <Table.Row key={emp.employee_id}>
                <Table.Cell>{emp.employee_id}</Table.Cell>
                <Table.Cell>
                  <Link as="a" href={`/employees/${emp.employee_id}`} color="blue.400">
                    {emp.name}
                  </Link>
                </Table.Cell>
                <Table.Cell>{emp.grade}</Table.Cell>
                <Table.Cell>{emp.title}</Table.Cell>
                <Table.Cell>{emp.department}</Table.Cell>
                <Table.Cell>{emp.home_base}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      )}
    </Box>
  )
}
