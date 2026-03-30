import React from 'react'
import { motion } from 'framer-motion'
import StoryInput from './components/StoryInput'
import GraphView  from './components/GraphView'

export default function App() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex h-screen w-screen overflow-hidden bg-ink-950"
    >
      {/* Left Panel */}
      <StoryInput />

      {/* Main Graph Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <GraphView />
      </main>
    </motion.div>
  )
}
