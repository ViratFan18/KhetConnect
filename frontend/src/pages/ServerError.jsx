import { useTranslation } from 'react-i18next'
import ErrorPage from '../components/ErrorPage'

export default function ServerError() {
  const { t } = useTranslation()

  return (
    <ErrorPage
      title={t('serverErrorTitle')}
      message={t('serverErrorMessage')}
      buttonText={t('goHome')}
      link="/"
    />
  )
}
