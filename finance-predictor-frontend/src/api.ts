const API = 'http://localhost:3000/api';
const TOKEN_KEY = 'finance-token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

function headers(): Record<string, string> {
  const result: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) {
    result.Authorization = `Bearer ${token}`;
  }
  return result;
}

async function parse<T>(res: Response): Promise<T> {
  if (res.status === 204) {
    return undefined as T;
  }
  const data = await res.json();
  if (res.status === 401 && getToken()) {
    setToken(null);
    window.dispatchEvent(new Event('auth-logout'));
  }
  if (!res.ok) {
    throw new Error(data.message || 'Request failed');
  }
  return data as T;
}

export const api = {
  register: (body: object) =>
    fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then((res) => parse(res)),

  login: (body: object) =>
    fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then((res) => parse(res)),

  me: () => fetch(`${API}/auth/me`, { headers: headers() }).then((res) => parse(res)),

  dashboard: (month: string) =>
    fetch(`${API}/dashboard?month=${month}`, { headers: headers() }).then((res) => parse(res)),

  transactions: (month?: string) => {
    const q = month ? `?month=${month}` : '';
    return fetch(`${API}/transactions${q}`, { headers: headers() }).then((res) => parse(res));
  },

  createTransaction: (body: object) =>
    fetch(`${API}/transactions`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body),
    }).then((res) => parse(res)),

  updateTransaction: (id: string, body: object) =>
    fetch(`${API}/transactions/${id}`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify(body),
    }).then((res) => parse(res)),

  debts: () => fetch(`${API}/debts`, { headers: headers() }).then((res) => parse(res)),

  createDebt: (body: object) =>
    fetch(`${API}/debts`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body),
    }).then((res) => parse(res)),

  updateDebt: (id: string, body: object) =>
    fetch(`${API}/debts/${id}`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify(body),
    }).then((res) => parse(res)),

  deleteDebt: (id: string) =>
    fetch(`${API}/debts/${id}`, { method: 'DELETE', headers: headers() }).then((res) => parse(res)),

  savingsGoals: () => fetch(`${API}/savings-goals`, { headers: headers() }).then((res) => parse(res)),

  createSavingsGoal: (body: object) =>
    fetch(`${API}/savings-goals`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body),
    }).then((res) => parse(res)),

  updateSavingsGoal: (id: string, body: object) =>
    fetch(`${API}/savings-goals/${id}`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify(body),
    }).then((res) => parse(res)),

  depositSavingsGoal: (id: string, body: object) =>
    fetch(`${API}/savings-goals/${id}/deposit`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body),
    }).then((res) => parse(res)),
};
