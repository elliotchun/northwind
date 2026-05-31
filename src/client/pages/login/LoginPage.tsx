import { Box, Text, Input, Button, VStack } from "@chakra-ui/react"
import { useForm } from "react-hook-form"
import { Toaster, toaster } from "../../../components/ui/toaster"

interface LoginForm {
  username: string
  password: string
}

export function LoginPage() {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<LoginForm>()

  const onSubmit = async (data: LoginForm) => {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (res.ok) {
      toaster.create({ title: "Login successful", duration: 3000 })
      window.location.href = "/"
    } else {
      const msg = await res.text()
      toaster.create({ title: "Login failed", description: msg, duration: 5000 })
    }
  }

  return (
    <Box minH="100vh" display="flex" alignItems="center" justifyContent="center">
      <VStack gap={4} w="full" maxW={400} p={8}>
        <Text fontSize="2xl" textAlign="center">Login</Text>
        <form onSubmit={handleSubmit(onSubmit)}>
          <VStack gap={4} w="full">
            <Input {...register("username")} placeholder="Username" required />
            <Input type="password" {...register("password")} placeholder="Password" required />
            <Button w="full" type="submit" disabled={isSubmitting}>
              Sign In
            </Button>
          </VStack>
        </form>
        <Toaster />
      </VStack>
    </Box>
  )
}
