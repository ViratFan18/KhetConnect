import { useTranslation } from 'react-i18next'
import ErrorPage from '../components/ErrorPage'

export default function Unauthorized() {
  const { t } = useTranslation()

  return (
    <ErrorPage
      title={t('unauthorizedTitle')}
      message={t('unauthorizedMessage')}
      buttonText={t('goHome')}
      link="/"
    />
  )
}
