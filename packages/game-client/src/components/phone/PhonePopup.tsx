import React from 'react'

type AnyQuestions = Record<string, any>

export default function PhonePopup(props: any) {
  const feedbackQuestions: AnyQuestions | undefined = props?.feedbackQuestions
  const currentScreen: string | undefined = props?.currentScreen

  // If the parent controls rendering and passes children, do not interfere.
  if (typeof props?.children !== 'undefined') return <>{props.children}</>

  const reportQuestions = feedbackQuestions?.bedroom_report
  const deleteQuestions = feedbackQuestions?.bedroom_delete

  const renderLoading = () => (
    <div className="p-4 text-white">
      <div className="font-semibold">Memuat pertanyaan...</div>
      <div className="text-sm opacity-80 mt-2">
        Jika layar tetap kosong, coba tutup dan buka HP lagi.
      </div>
    </div>
  )

  return (
    <div className="phone-popup">
      {currentScreen === 'feedback-report' && (!reportQuestions || reportQuestions.length === 0)
        ? renderLoading()
        : null}

      {currentScreen === 'feedback-delete' && (!deleteQuestions || deleteQuestions.length === 0)
        ? renderLoading()
        : null}
    </div>
  )
}