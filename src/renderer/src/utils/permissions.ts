/**
 * Permissions — role-based access control constants and helpers.
 *
 * Permission format: "module:action"
 * Examples: "sales:create", "inventory:view", "accounting:edit", "settings:manage"
 *
 * Built-in roles:
 *   - admin: all permissions (full access)
 *   - manager: all except settings:manage
 *   - accountant: accounting, reports, customers, sales (view only)
 *   - salesperson: sales, customers (view), inventory (view)
 *   - warehouse: inventory, suppliers, purchases
 *   - viewer: all view permissions (read-only)
 *
 * Custom roles can be created by combining permission strings.
 */

export type Permission =
  | 'sales:view' | 'sales:create' | 'sales:edit' | 'sales:delete'
  | 'inventory:view' | 'inventory:edit' | 'inventory:adjust'
  | 'accounting:view' | 'accounting:edit' | 'accounting:journal'
  | 'customers:view' | 'customers:edit' | 'customers:block'
  | 'suppliers:view' | 'suppliers:edit' | 'suppliers:purchase'
  | 'reports:view' | 'reports:export'
  | 'settings:view' | 'settings:manage'
  | 'users:view' | 'users:manage'
  | 'products:view' | 'products:create' | 'products:edit' | 'products:delete'
  | 'expenses:view' | 'expenses:create' | 'expenses:edit'
  | 'service:view' | 'service:create' | 'service:edit'
  | 'proforma:view' | 'proforma:create' | 'proforma:convert'
  | 'installment:view' | 'installment:create' | 'installment:edit'

export type RoleName = 'admin' | 'manager' | 'accountant' | 'salesperson' | 'warehouse' | 'viewer'

/** Default permissions for each built-in role */
export const ROLE_PERMISSIONS: Record<RoleName, Permission[]> = {
  admin: [
    'sales:view', 'sales:create', 'sales:edit', 'sales:delete',
    'inventory:view', 'inventory:edit', 'inventory:adjust',
    'accounting:view', 'accounting:edit', 'accounting:journal',
    'customers:view', 'customers:edit', 'customers:block',
    'suppliers:view', 'suppliers:edit', 'suppliers:purchase',
    'reports:view', 'reports:export',
    'settings:view', 'settings:manage',
    'users:view', 'users:manage',
    'products:view', 'products:create', 'products:edit', 'products:delete',
    'expenses:view', 'expenses:create', 'expenses:edit',
    'service:view', 'service:create', 'service:edit',
    'proforma:view', 'proforma:create', 'proforma:convert',
    'installment:view', 'installment:create', 'installment:edit',
  ],
  manager: [
    'sales:view', 'sales:create', 'sales:edit',
    'inventory:view', 'inventory:edit', 'inventory:adjust',
    'accounting:view', 'accounting:edit', 'accounting:journal',
    'customers:view', 'customers:edit', 'customers:block',
    'suppliers:view', 'suppliers:edit', 'suppliers:purchase',
    'reports:view', 'reports:export',
    'settings:view',
    'users:view',
    'products:view', 'products:create', 'products:edit',
    'expenses:view', 'expenses:create', 'expenses:edit',
    'service:view', 'service:create', 'service:edit',
    'proforma:view', 'proforma:create', 'proforma:convert',
    'installment:view', 'installment:create', 'installment:edit',
  ],
  accountant: [
    'sales:view', 'inventory:view', 'accounting:view', 'accounting:edit', 'accounting:journal',
    'customers:view', 'suppliers:view', 'reports:view', 'reports:export',
    'settings:view', 'products:view', 'expenses:view', 'expenses:create', 'expenses:edit',
    'service:view', 'proforma:view', 'installment:view',
  ],
  salesperson: [
    'sales:view', 'sales:create', 'customers:view', 'customers:edit',
    'inventory:view', 'products:view', 'reports:view',
    'service:view', 'service:create', 'proforma:view', 'proforma:create',
    'installment:view',
  ],
  warehouse: [
    'inventory:view', 'inventory:edit', 'inventory:adjust',
    'suppliers:view', 'suppliers:edit', 'suppliers:purchase',
    'products:view', 'products:create', 'products:edit',
    'reports:view', 'service:view', 'service:edit',
    'proforma:view', 'installment:view',
  ],
  viewer: [
    'sales:view', 'inventory:view', 'accounting:view', 'customers:view',
    'suppliers:view', 'reports:view', 'products:view', 'expenses:view',
    'service:view', 'proforma:view', 'installment:view',
  ],
}

/** Role display names in Persian */
export const ROLE_LABELS: Record<RoleName, string> = {
  admin: 'مدیر سیستم', manager: 'مدیر', accountant: 'حسابدار',
  salesperson: 'فروشنده', warehouse: 'انباردار', viewer: 'مشاهده‌گر',
}

/** Permission display names in Persian */
export const PERMISSION_LABELS: Record<Permission, string> = {
  'sales:view': 'مشاهده فروش', 'sales:create': 'ایجاد فروش', 'sales:edit': 'ویرایش فروش', 'sales:delete': 'حذف فروش',
  'inventory:view': 'مشاهده انبار', 'inventory:edit': 'ویرایش انبار', 'inventory:adjust': 'اصلاح موجودی',
  'accounting:view': 'مشاهده حسابداری', 'accounting:edit': 'ویرایش حسابداری', 'accounting:journal': 'ثبت سند حسابداری',
  'customers:view': 'مشاهده مشتریان', 'customers:edit': 'ویرایش مشتریان', 'customers:block': 'مسدودی مشتری',
  'suppliers:view': 'مشاهده تأمین‌کنندگان', 'suppliers:edit': 'ویرایش تأمین‌کنندگان', 'suppliers:purchase': 'ثبت خرید',
  'reports:view': 'مشاهده گزارش‌ها', 'reports:export': 'خروجی گزارش',
  'settings:view': 'مشاهده تنظیمات', 'settings:manage': 'مدیریت تنظیمات',
  'users:view': 'مشاهده کاربران', 'users:manage': 'مدیریت کاربران',
  'products:view': 'مشاهده کالاها', 'products:create': 'ایجاد کالا', 'products:edit': 'ویرایش کالا', 'products:delete': 'حذف کالا',
  'expenses:view': 'مشاهده هزینه‌ها', 'expenses:create': 'ایجاد هزینه', 'expenses:edit': 'ویرایش هزینه',
  'service:view': 'مشاهده تیکت‌ها', 'service:create': 'ایجاد تیکت', 'service:edit': 'ویرایش تیکت',
  'proforma:view': 'مشاهده پیش‌فاکتور', 'proforma:create': 'ایجاد پیش‌فاکتور', 'proforma:convert': 'تبدیل پیش‌فاکتور',
  'installment:view': 'مشاهده اقساط', 'installment:create': 'ایجاد قسط', 'installment:edit': 'ویرایش قسط',
}

/** Permission groups for UI organization */
export const PERMISSION_GROUPS: { label: string; permissions: Permission[] }[] = [
  { label: 'فروش', permissions: ['sales:view', 'sales:create', 'sales:edit', 'sales:delete'] },
  { label: 'انبار', permissions: ['inventory:view', 'inventory:edit', 'inventory:adjust'] },
  { label: 'کالاها', permissions: ['products:view', 'products:create', 'products:edit', 'products:delete'] },
  { label: 'حسابداری', permissions: ['accounting:view', 'accounting:edit', 'accounting:journal'] },
  { label: 'مشتریان', permissions: ['customers:view', 'customers:edit', 'customers:block'] },
  { label: 'تأمین‌کنندگان', permissions: ['suppliers:view', 'suppliers:edit', 'suppliers:purchase'] },
  { label: 'هزینه‌ها', permissions: ['expenses:view', 'expenses:create', 'expenses:edit'] },
  { label: 'گزارش‌ها', permissions: ['reports:view', 'reports:export'] },
  { label: 'تعمیرات', permissions: ['service:view', 'service:create', 'service:edit'] },
  { label: 'پیش‌فاکتور', permissions: ['proforma:view', 'proforma:create', 'proforma:convert'] },
  { label: 'اقساط', permissions: ['installment:view', 'installment:create', 'installment:edit'] },
  { label: 'تنظیمات', permissions: ['settings:view', 'settings:manage'] },
  { label: 'کاربران', permissions: ['users:view', 'users:manage'] },
]

/** Check if a user has a specific permission */
export function hasPermission(userPermissions: string[] | string, permission: Permission): boolean {
  const perms = Array.isArray(userPermissions) ? userPermissions : JSON.parse(userPermissions || '[]')
  return perms.includes(permission) || perms.includes('*')
}

/** Check if a user has any of the given permissions */
export function hasAnyPermission(userPermissions: string[] | string, permissions: Permission[]): boolean {
  return permissions.some(p => hasPermission(userPermissions, p))
}

/** Get permissions for a role (includes role defaults + custom permissions) */
export function getEffectivePermissions(role: RoleName, customPermissions: string = '{}'): Permission[] {
  const rolePerms = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.viewer
  const custom = typeof customPermissions === 'string' ? JSON.parse(customPermissions || '{}') : customPermissions
  const extra = custom.extra || []
  return [...new Set([...rolePerms, ...extra])]
}
