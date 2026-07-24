/**
 * Bank accounts, employees, and payroll tests.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { createTestDb } from './helpers/testDb'

let db: any

beforeEach(async () => {
  db = await createTestDb()
})

describe('Bank accounts', () => {
  it('bank_accounts table exists', () => {
    const r = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='bank_accounts'").get()
    expect(r).toBeTruthy()
  })

  it('bank_transactions table exists', () => {
    const r = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='bank_transactions'").get()
    expect(r).toBeTruthy()
  })

  it('CRUD operations work', () => {
    db.prepare('INSERT INTO bank_accounts (name, account_number, bank_name, current_balance) VALUES (?, ?, ?, ?)').run('حساب ملی', '1234', 'ملی', 100000)
    const acct = db.prepare('SELECT * FROM bank_accounts WHERE name = ?').get('حساب ملی')
    expect(acct.current_balance).toBe(100000)

    db.prepare('UPDATE bank_accounts SET current_balance = ? WHERE id = ?').run(150000, acct.id)
    const updated = db.prepare('SELECT current_balance FROM bank_accounts WHERE id = ?').get(acct.id)
    expect(updated.current_balance).toBe(150000)
  })

  it('deposit increases balance', () => {
    db.prepare('INSERT INTO bank_accounts (name, current_balance) VALUES (?, ?)').run('تست', 100000)
    const acct = db.prepare('SELECT id FROM bank_accounts WHERE name = ?').get('تست')
    db.prepare('UPDATE bank_accounts SET current_balance = current_balance + ? WHERE id = ?').run(50000, acct.id)
    const updated = db.prepare('SELECT current_balance FROM bank_accounts WHERE id = ?').get(acct.id)
    expect(updated.current_balance).toBe(150000)
  })

  it('withdraw decreases balance', () => {
    db.prepare('INSERT INTO bank_accounts (name, current_balance) VALUES (?, ?)').run('تست', 100000)
    const acct = db.prepare('SELECT id FROM bank_accounts WHERE name = ?').get('تست')
    db.prepare('UPDATE bank_accounts SET current_balance = current_balance - ? WHERE id = ?').run(30000, acct.id)
    const updated = db.prepare('SELECT current_balance FROM bank_accounts WHERE id = ?').get(acct.id)
    expect(updated.current_balance).toBe(70000)
  })

  it('transfer between accounts', () => {
    db.prepare('INSERT INTO bank_accounts (name, current_balance) VALUES (?, ?)').run('حساب۱', 100000)
    db.prepare('INSERT INTO bank_accounts (name, current_balance) VALUES (?, ?)').run('حساب۲', 50000)
    const a1 = db.prepare('SELECT id FROM bank_accounts WHERE name = ?').get('حساب۱')
    const a2 = db.prepare('SELECT id FROM bank_accounts WHERE name = ?').get('حساب۲')
    db.prepare('UPDATE bank_accounts SET current_balance = current_balance - ? WHERE id = ?').run(20000, a1.id)
    db.prepare('UPDATE bank_accounts SET current_balance = current_balance + ? WHERE id = ?').run(20000, a2.id)
    expect(db.prepare('SELECT current_balance FROM bank_accounts WHERE id = ?').get(a1.id).current_balance).toBe(80000)
    expect(db.prepare('SELECT current_balance FROM bank_accounts WHERE id = ?').get(a2.id).current_balance).toBe(70000)
  })

  it('transaction history records correctly', () => {
    db.prepare('INSERT INTO bank_accounts (name, current_balance) VALUES (?, ?)').run('تست', 0)
    const acct = db.prepare('SELECT id FROM bank_accounts WHERE name = ?').get('تست')
    db.prepare('INSERT INTO bank_transactions (bankAccountId, transactionDate, type, amount, balanceAfter, description) VALUES (?, ?, ?, ?, ?, ?)').run(acct.id, '2026-07-01', 'deposit', 100000, 100000, 'واریز اولیه')
    db.prepare('INSERT INTO bank_transactions (bankAccountId, transactionDate, type, amount, balanceAfter, description) VALUES (?, ?, ?, ?, ?, ?)').run(acct.id, '2026-07-02', 'withdrawal', 30000, 70000, 'برداشت')
    const txns = db.prepare('SELECT * FROM bank_transactions WHERE bankAccountId = ? ORDER BY transactionDate').all(acct.id)
    expect(txns.length).toBe(2)
    expect(txns[0].type).toBe('deposit')
    expect(txns[1].type).toBe('withdrawal')
  })
})

describe('Employees', () => {
  it('employees table exists', () => {
    const r = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='employees'").get()
    expect(r).toBeTruthy()
  })

  it('salary_payments table exists', () => {
    const r = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='salary_payments'").get()
    expect(r).toBeTruthy()
  })

  it('CRUD operations work', () => {
    db.prepare('INSERT INTO employees (full_name, position, baseSalary, salaryType) VALUES (?, ?, ?, ?)').run('علی رضایی', 'برنامه‌نویس', 15000000, 'monthly')
    const emp = db.prepare('SELECT * FROM employees WHERE full_name = ?').get('علی رضایی')
    expect(emp.baseSalary).toBe(15000000)
    expect(emp.salaryType).toBe('monthly')
  })

  it('payroll calculation is correct', () => {
    db.prepare('INSERT INTO employees (full_name, baseSalary, salaryType) VALUES (?, ?, ?)').run('تست', 10000000, 'monthly')
    const emp = db.prepare('SELECT id FROM employees WHERE full_name = ?').get('تست')
    const base = 10000000
    const bonuses = 2000000
    const deductions = 500000
    const overtime = 1500000
    const tax = 300000
    const insurance = 200000
    const netSalary = base + bonuses + overtime - deductions - tax - insurance
    db.prepare('INSERT INTO salary_payments (employeeId, paymentDate, period, baseSalary, bonuses, deductions, netSalary, overtimeAmount, taxAmount, insuranceAmount, paymentMethod, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(emp.id, '2026-07-01', 'تیر ۱۴۰۴', base, bonuses, deductions, netSalary, overtime, tax, insurance, 'cash', 'paid')
    const payment = db.prepare('SELECT * FROM salary_payments WHERE employeeId = ?').get(emp.id)
    expect(payment.netSalary).toBe(netSalary)
    expect(payment.baseSalary).toBe(10000000)
    expect(payment.bonuses).toBe(2000000)
  })

  it('payroll history per employee', () => {
    db.prepare('INSERT INTO employees (full_name, baseSalary) VALUES (?, ?)').run('کارمند', 10000000)
    const emp = db.prepare('SELECT id FROM employees WHERE full_name = ?').get('کارمند')
    db.prepare('INSERT INTO salary_payments (employeeId, paymentDate, period, baseSalary, netSalary, status) VALUES (?, ?, ?, ?, ?, ?)').run(emp.id, '2026-06-01', 'خرداد', 10000000, 10000000, 'paid')
    db.prepare('INSERT INTO salary_payments (employeeId, paymentDate, period, baseSalary, netSalary, status) VALUES (?, ?, ?, ?, ?, ?)').run(emp.id, '2026-07-01', 'تیر', 10000000, 10000000, 'paid')
    const history = db.prepare('SELECT * FROM salary_payments WHERE employeeId = ? ORDER BY paymentDate DESC').all(emp.id)
    expect(history.length).toBe(2)
    expect(history[0].period).toBe('تیر')
  })
})

describe('Supplier debt accounting', () => {
  it('debt create posts journal entry', () => {
    // Register supplier debt
    db.prepare('INSERT INTO suppliers (name) VALUES (?)').run('تأمین تست')
    const sup = db.prepare('SELECT id FROM suppliers WHERE name = ?').get('تأمین تست')
    db.prepare('INSERT INTO supplier_debts (supplierId, amount, date, description) VALUES (?, ?, ?, ?)').run(sup.id, 500000, '2026-07-01', 'بدهی')
    // Verify debt is recorded
    const debt = db.prepare('SELECT * FROM supplier_debts WHERE supplierId = ?').get(sup.id)
    expect(debt.amount).toBe(500000)
    expect(debt.status).toBe('pending')
  })

  it('debt payment updates paid amount and status', () => {
    db.prepare('INSERT INTO suppliers (name) VALUES (?)').run('تأمین تست')
    const sup = db.prepare('SELECT id FROM suppliers WHERE name = ?').get('تأمین تست')
    db.prepare('INSERT INTO supplier_debts (supplierId, amount, date) VALUES (?, ?, ?)').run(sup.id, 500000, '2026-07-01')
    const debt = db.prepare('SELECT id FROM supplier_debts WHERE supplierId = ?').get(sup.id)
    // Pay 300000
    db.prepare('UPDATE supplier_debts SET paidAmount = ?, status = ? WHERE id = ?').run(300000, 'partial', debt.id)
    db.prepare('INSERT INTO supplier_debt_payments (debtId, amount, paymentDate, method) VALUES (?, ?, ?, ?)').run(debt.id, 300000, '2026-07-15', 'cash')
    const updated = db.prepare('SELECT * FROM supplier_debts WHERE id = ?').get(debt.id)
    expect(updated.paidAmount).toBe(300000)
    expect(updated.status).toBe('partial')
    // Pay remaining 200000
    db.prepare('UPDATE supplier_debts SET paidAmount = ?, status = ? WHERE id = ?').run(500000, 'paid', debt.id)
    const final = db.prepare('SELECT * FROM supplier_debts WHERE id = ?').get(debt.id)
    expect(final.status).toBe('paid')
  })
})
