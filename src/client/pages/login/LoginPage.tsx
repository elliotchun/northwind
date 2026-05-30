import { Box, Text, Input, Button, VStack } from "@chakra-ui/react"

export function LoginPage() {
  return (
    <Box minH="100vh" display="flex" alignItems="center" justifyContent="center">
      <VStack gap={4} w="full" maxW={400} p={8}>
        <Text fontSize="2xl" textAlign="center">Login</Text>
        <Input placeholder="Email" />
        <Input type="password" placeholder="Password" />
        <Button w="full">Sign In</Button>
      </VStack>
    </Box>
  )
}
