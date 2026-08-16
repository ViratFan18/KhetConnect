import { useTranslation } from 'react-i18next'
import ErrorPage from '../components/ErrorPage'

export default function ServerError() {
  const { t } = useTranslation()

  return (
    <ErrorPage
      type="server"
      title={t('serverErrorTitle')}
      subtitle="Error 500"
      message={t('serverErrorMessage')}
      details="Something went wrong on our servers. Our team has been notified."
      buttonText={t('goHome')}
      link="/"
    />
  )
}
