import LoginForm from "./LoginForm"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="bg-[#1e272e] p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-text mb-2 text-center">ID Bassin Congo</h1>
        <p className="text-text/70 text-center mb-8">Plateforme de traçabilité EUDR</p>
        <LoginForm />
      </div>
    </div>
  )
}