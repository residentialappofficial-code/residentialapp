import {
 Button,
 Clipboard as ChakraClipboard,
 IconButton,
 Input,
} from '@chakra-ui/react'
import * as React from 'react'
import { Check, Clipboard as ClipboardIcon, Link } from 'lucide-react'

const ClipboardIconInner = React.forwardRef(function ClipboardIcon(props, ref) {
 return (
  <ChakraClipboard.Indicator copied={<Check />} {...props} ref={ref}>
   <ClipboardIcon />
  </ChakraClipboard.Indicator>
 )
})

const ClipboardCopyText = React.forwardRef(
 function ClipboardCopyText(props, ref) {
  return (
   <ChakraClipboard.Indicator copied='Copied' {...props} ref={ref}>
    Copy
   </ChakraClipboard.Indicator>
  )
 },
)

export const ClipboardLabel = React.forwardRef(
 function ClipboardLabel(props, ref) {
  return (
   <ChakraClipboard.Label
    textStyle='sm'
    fontWeight='medium'
    display='inline-block'
    mb='1'
    {...props}
    ref={ref}
   />
  )
 },
)

export const ClipboardButton = React.forwardRef(
 function ClipboardButton(props, ref) {
  return (
   <ChakraClipboard.Trigger asChild>
    <Button ref={ref} size='sm' variant='surface' {...props}>
     <ClipboardIconInner />
     <ClipboardCopyText />
    </Button>
   </ChakraClipboard.Trigger>
  )
 },
)

export const ClipboardLink = React.forwardRef(
 function ClipboardLink(props, ref) {
  return (
   <ChakraClipboard.Trigger asChild>
    <Button
     unstyled
     variant='plain'
     size='xs'
     display='inline-flex'
     alignItems='center'
     gap='2'
     ref={ref}
     {...props}
    >
     <Link />
     <ClipboardCopyText />
    </Button>
   </ChakraClipboard.Trigger>
  )
 },
)

export const ClipboardIconButton = React.forwardRef(
 function ClipboardIconButton(props, ref) {
  return (
   <ChakraClipboard.Trigger asChild>
    <IconButton ref={ref} size='xs' variant='subtle' {...props}>
     <ClipboardIconInner />
     <ClipboardCopyText srOnly />
    </IconButton>
   </ChakraClipboard.Trigger>
  )
 },
)

export const ClipboardInput = React.forwardRef(
 function ClipboardInputElement(props, ref) {
  return (
   <ChakraClipboard.Input asChild>
    <Input ref={ref} {...props} />
   </ChakraClipboard.Input>
  )
 },
)

export const ClipboardRoot = ChakraClipboard.Root
