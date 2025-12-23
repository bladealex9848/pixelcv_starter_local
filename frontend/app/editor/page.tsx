import CVWizard from '../../components/CVWizard'
import PrivateRoute from '../../components/PrivateRoute'

export default function Editor() {
  return (
    <PrivateRoute>
      <CVWizard />
    </PrivateRoute>
  )
}
