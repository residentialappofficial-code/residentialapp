---
name: simperumahan-dev
description: Core development workflow for SimPerumahan. Use when building or modifying any feature in the residential management app. Enforces the project's tech stack (React + Vite + Supabase + Chakra UI v3) and coding conventions.
---

# SimPerumahan Development Skill (Chakra UI v3)

## Overview

Build premium, production-quality features for the SimPerumahan residential management system. This skill ensures consistent use of the project's **Chakra UI v3** design system and established patterns.

## Tech Stack

```
Frontend:   React 19 + Vite
Styling:    Chakra UI v3 (Style Props)
Components: Chakra UI Primitives + @/components/ui/chakra/*
Backend:    Supabase (Auth, Database, RLS)
State:      React Context (AuthContext) + local useState
Routing:    React Router v7
Icons:      Lucide React
Toasts:     Chakra Toaster (@/components/ui/chakra/toaster)
Port:       5174 (configured in vite.config.js)
```

## When to Use

- Building new pages or components
- Modifying existing UI or business logic
- Adding new Supabase tables or queries
- Fixing UI bugs or layout issues

## Critical Rules

### Rule 1: Use Chakra UI Style Props

Avoid global CSS or Tailwind classes. Use Chakra's layout components and style props for all design:

```jsx
// ✅ CORRECT - Chakra UI
import { Box, Flex, VStack, Heading, Text, Button } from "@chakra-ui/react";

<VStack spacing={4} align="stretch" p={6} bg="white" shadow="sm" borderRadius="lg">
  <Heading size="md">Title</Heading>
  <Text color="gray.600">Content goes here...</Text>
  <Button colorScheme="blue">Action</Button>
</VStack>
```

### Rule 2: Stat Cards Pattern

Use this component pattern for dashboard statistics:

```jsx
const StatCard = ({ label, value, icon, color, loading }) => (
  <Box borderLeft="4px solid" borderLeftColor={`${color}.500`} bg="white" p={5} borderRadius="xl" shadow="sm">
    <Flex justify="space-between" align="center" mb={2}>
      <Text fontWeight="medium" color="gray.600" fontSize="sm">{label}</Text>
      <Icon as={icon} color={`${color}.600`} boxSize={5} />
    </Flex>
    {loading ? <Spinner size="sm" /> : <Text fontSize="2xl" fontWeight="bold">{value}</Text>}
  </Box>
);
```

### Rule 3: Dialog/Modal Pattern

Use project-specific Chakra Dialog components:

```jsx
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogActionTrigger,
} from "@/components/ui/chakra/dialog";

<DialogRoot open={isOpen} onOpenChange={(e) => setIsOpen(e.open)} placement="center">
  <DialogContent>
    <DialogHeader><DialogTitle>Title</DialogTitle></DialogHeader>
    <DialogBody>
      <Stack spacing={4}>
        <FormControl isRequired>
          <FormLabel>Name</FormLabel>
          <Input placeholder="Enter name" />
        </FormControl>
      </Stack>
    </DialogBody>
    <DialogFooter>
      <DialogActionTrigger asChild><Button variant="ghost">Batal</Button></DialogActionTrigger>
      <Button colorScheme="blue" onClick={handleSubmit}>Simpan</Button>
    </DialogFooter>
  </DialogContent>
</DialogRoot>
```

### Rule 4: Table Pattern

```jsx
<Box bg="white" borderRadius="lg" border="1px solid" borderColor="gray.200" overflow="hidden">
  <Table variant="simple">
    <Thead bg="gray.50">
      <Tr>
        <Th>Column</Th>
        <Th textAlign="right">Amount</Th>
      </Tr>
    </Thead>
    <Tbody>
      {loading ? (
        <Tr><Td colSpan={N} py={10}><Center><Spinner /></Center></Td></Tr>
      ) : (
        data.map(item => <Tr key={item.id}>...</Tr>)
      )}
    </Tbody>
  </Table>
</Box>
```

### Rule 5: Supabase Data Pattern

```jsx
const fetchData = async () => {
  try {
    setLoading(true);
    const { data, error } = await supabase.from('table').select('*');
    if (error) throw error;
    setData(data || []);
  } catch (err) {
    toaster.create({ title: "Gagal", description: err.message, type: "error" });
  } finally {
    setLoading(false);
  }
};
```

## Anti-Rationalizations

| Rationalization | Reality |
|---|---|
| "I'll use a Tailwind class for speed" | Tailwind was removed. Use Chakra style props (e.g., `px={4}`, `bg="blue.500"`). |
| "I'll use standard HTML button" | Use Chakra `<Button>`. It handles accessibility and focus states automatically. |
| "I'll skip the DialogRoot and use a raw div" | `DialogRoot` handles focus trapping, portal rendering, and escape-key closing. |

## Red Flags

- Use of `className="..."` with Tailwind-specific keywords (e.g., `flex`, `p-4`, `bg-blue-500`).
- Direct imports from deleted `@/components/ui/` files.
- Missing `toaster` usage for user feedback.

## Verification

- [ ] `npm run dev` starts without errors.
- [ ] No Tailwind CSS classes remain in the JSX.
- [ ] Responsive behavior works using Chakra's object syntax (e.g., `w={{ base: "full", md: "200px" }}`).
- [ ] Accessibility (ARIA tags) is maintained by using Chakra components.
