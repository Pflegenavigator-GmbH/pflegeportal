'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Types
export interface ModuleAnswer {
  moduleNumber: number
  moduleName: string
  answers: Record<string, any>
  completedAt?: string
}

export interface CaseState {
  caseId: string | null
  caseCode: string | null
  currentModule: number
  answers: ModuleAnswer[]
  
  // Actions
  setCase: (caseId: string, caseCode: string) => void
  setCurrentModule: (module: number) => void
  saveModuleAnswers: (moduleNumber: number, moduleName: string, answers: Record<string, any>) => void
  getModuleAnswers: (moduleNumber: number) => ModuleAnswer | undefined
  isModuleCompleted: (moduleNumber: number) => boolean
  getCompletedCount: () => number
  clearCase: () => void
}

export const useCaseStore = create<CaseState>()(
  persist(
    (set, get) => ({
      caseId: null,
      caseCode: null,
      currentModule: 1,
      answers: [],

      setCase: (caseId, caseCode) => set({ caseId, caseCode }),
      
      setCurrentModule: (module) => set({ currentModule: module }),
      
      saveModuleAnswers: (moduleNumber, moduleName, answers) => {
        const existing = get().answers.find(a => a.moduleNumber === moduleNumber)
        
        if (existing) {
          set(state => ({
            answers: state.answers.map(a =>
              a.moduleNumber === moduleNumber
                ? { ...a, moduleName, answers, completedAt: new Date().toISOString() }
                : a
            )
          }))
        } else {
          set(state => ({
            answers: [...state.answers, {
              moduleNumber,
              moduleName,
              answers,
              completedAt: new Date().toISOString()
            }]
          }))
        }
      },
      
      getModuleAnswers: (moduleNumber) => {
        return get().answers.find(a => a.moduleNumber === moduleNumber)
      },
      
      isModuleCompleted: (moduleNumber) => {
        return get().answers.some(a => a.moduleNumber === moduleNumber)
      },
      
      getCompletedCount: () => {
        return get().answers.filter(a => a.completedAt).length
      },
      
      clearCase: () => set({
        caseId: null,
        caseCode: null,
        currentModule: 1,
        answers: []
      })
    }),
    {
      name: 'pflege-navigator-case',
      skipHydration: true
    }
  )
)
