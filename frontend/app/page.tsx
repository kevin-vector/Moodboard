"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to moodboard page immediately
    router.push("/moodboard")
  }, [router])

  return null
}
