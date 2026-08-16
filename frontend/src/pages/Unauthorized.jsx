import { useTranslation } from 'react-i18next'
import ErrorPage from '../components/ErrorPage'

export default function Unauthorized() {
  const { t } = useTranslation()

  return (
    <ErrorPage
      type="unauthorized"
      title={t('unauthorizedTitle')}
      subtitle="Error 401"
      message={t('unauthorizedMessage')}
      details="You need to be logged in to access this resource."
      buttonText={t('goHome')}
      link="/"
    />
  )
}
