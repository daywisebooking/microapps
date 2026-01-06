import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Random username generation (Reddit-style)
const adjectives = [
  "Brave", "Clever", "Swift", "Bold", "Calm", "Bright", "Cool", "Daring",
  "Eager", "Fair", "Gentle", "Happy", "Keen", "Lively", "Mighty", "Noble",
  "Quick", "Wise", "Witty", "Zesty", "Ancient", "Cosmic", "Electric", "Mystic",
  "Silent", "Wild", "Agile", "Creative", "Epic", "Fancy", "Grand", "Heroic",
  "Lucky", "Magic", "Royal", "Stellar", "Turbo", "Ultra", "Vivid", "Wonder"
]

const nouns = [
  "Tiger", "Eagle", "Falcon", "Phoenix", "Dragon", "Wolf", "Bear", "Lion",
  "Hawk", "Fox", "Panther", "Raven", "Shark", "Cobra", "Lynx", "Orca",
  "Puma", "Viper", "Badger", "Bison", "Cheetah", "Coyote", "Dolphin", "Gecko",
  "Jaguar", "Koala", "Leopard", "Moose", "Otter", "Panda", "Rhino", "Stallion",
  "Turtle", "Unicorn", "Walrus", "Yak", "Zebra", "Mongoose", "Elephant", "Owl"
]

export function generateRandomUsername(): string {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  const number = Math.floor(Math.random() * 900) + 100 // 100-999
  return `${adjective}-${noun}-${number}`
}

