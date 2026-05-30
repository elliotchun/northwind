import { Flex, Heading, Text } from "@chakra-ui/react"

export function Navbar() {
  return (
    <Flex as="nav" bg="gray.100" p={4} gap={6}>
      <Heading size="md">Northwind</Heading>
      <Text>Employees</Text>
      <Text>Upload</Text>
      <Text>Receipts</Text>
      <Text>Chat</Text>
    </Flex>
  )
}
