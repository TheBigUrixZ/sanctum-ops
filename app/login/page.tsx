import LoginForm from "./login-form";

type LoginPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <main className="login-page">
      <LoginForm nextPath={params.next || "/"} />
    </main>
  );
}
