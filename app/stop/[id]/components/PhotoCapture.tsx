'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'

interface PhotoCaptureProps {
  stopId: string
  existingPhotoUrl: string | null
}

type UploadState = 'idle' | 'uploading' | 'done' | 'error'

export default function PhotoCapture({ stopId, existingPhotoUrl }: PhotoCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(existingPhotoUrl)
  const [uploadState, setUploadState] = useState<UploadState>(
    existingPhotoUrl ? 'done' : 'idle'
  )
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const localPreview = URL.createObjectURL(file)
    setPreview(localPreview)
    setUploadState('uploading')
    setErrorMsg(null)

    const formData = new FormData()
    formData.append('photo', file)

    try {
      const res = await fetch(`/api/stops/${stopId}/photo`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error ?? `Error ${res.status}`)
      }

      setUploadState('done')
    } catch (err) {
      setUploadState('error')
      setErrorMsg(
        err instanceof Error ? err.message : 'No se pudo subir la foto. Intenta de nuevo.'
      )
      setPreview(existingPhotoUrl)
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-700">
        Foto de evidencia{' '}
        <span className="text-gray-400 font-normal">(opcional)</span>
      </p>

      {preview ? (
        <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
          <Image
            src={preview}
            alt="Evidencia de la visita"
            width={400}
            height={240}
            className="w-full h-48 object-cover"
            unoptimized
          />
          {uploadState === 'uploading' && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
            </div>
          )}
          {uploadState === 'done' && (
            <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
          )}
          {uploadState !== 'uploading' && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="absolute bottom-2 right-2 bg-white/90 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 active:bg-gray-100 transition-colors"
            >
              Cambiar foto
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full h-12 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 text-sm text-gray-500 font-medium active:bg-gray-50 transition-colors"
        >
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
          </svg>
          Tomar foto de evidencia
        </button>
      )}

      {errorMsg && (
        <p className="text-xs text-red-600">{errorMsg}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
        aria-label="Seleccionar foto de evidencia"
      />
    </div>
  )
}
