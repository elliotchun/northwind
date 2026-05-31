import { Flex, Heading, Link, Text } from "@chakra-ui/react"

export function Navbar() {
  return (
    <Flex as="nav" bg="gray.100" p={4} gap={6} color={"black"}>
      <Heading size="md">Northwind</Heading>
      <Link href="employees" color={"gray.600"}>Employees</Link>
      <Link href="upload" color={"gray.600"}>Upload</Link>
      <Link href="receipts" color={"gray.600"}>Receipts</Link>
      <Link href="chat" color={"gray.600"}>Chat</Link>
      <Link href="login" color={"gray.600"}>Login</Link>
    </Flex>
  )
}
