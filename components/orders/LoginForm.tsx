type LoginFormProps = {
  loginForm: {
    login: string;
    password: string;
  };
  setLoginForm: React.Dispatch<
    React.SetStateAction<{
      login: string;
      password: string;
    }>
  >;
  loginError: string;
  onLogin: () => void;
};

export function LoginForm({
  loginForm,
  setLoginForm,
  loginError,
  onLogin,
}: LoginFormProps) {
  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 flex items-center justify-center">
      <div className="w-full max-w-md overflow-hidden rounded-[30px] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.10)] ring-1 ring-slate-200">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-6 text-white">
          <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-200">
            Система заказов
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">Вход в систему</h1>
          <p className="mt-2 text-sm text-slate-300">
            Введи данные учетной записи, чтобы продолжить работу с заказами.
          </p>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                type="email"
                value={loginForm.login}
                onChange={(e) => setLoginForm({ ...loginForm, login: e.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Пароль
              </label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:bg-white"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    onLogin();
                  }
                }}
              />
            </div>

            {loginError ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {loginError}
              </div>
            ) : null}

            <button
              onClick={onLogin}
              className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Войти
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
