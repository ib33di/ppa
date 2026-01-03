# دليل إعداد نظام المصادقة

## نظرة عامة

تم إضافة نظام مصادقة كامل باستخدام:
- **Supabase Auth** لإدارة المستخدمين
- **JWT Tokens** للمصادقة في Backend
- **Protected Routes** في Frontend
- **Role-Based Access Control (RBAC)**

## الأدوار المتاحة

- **admin**: صلاحيات كاملة (إنشاء، تعديل، حذف)
- **manager**: إدارة المباريات واللاعبين
- **user**: عرض فقط

## خطوات الإعداد

### 1. تحديث قاعدة البيانات

قم بتشغيل ملف `supabase/auth-schema.sql` في Supabase SQL Editor:

```sql
-- هذا الملف يضيف:
-- 1. جدول user_profiles
-- 2. RLS Policies محدثة
-- 3. Trigger لإنشاء profile تلقائياً عند التسجيل
```

### 2. تفعيل Supabase Auth

1. اذهب إلى Supabase Dashboard > Authentication
2. فعّل **Email Auth Provider**
3. (اختياري) فعّل **Email Confirmations** إذا أردت التحقق من البريد

### 3. تحديث Backend .env

أضف المتغيرات التالية:

```env
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

**⚠️ مهم**: غيّر `JWT_SECRET` في الإنتاج!

### 4. تثبيت Dependencies

```bash
cd backend
npm install
```

### 5. إنشاء مستخدم Admin

#### الطريقة 1: عبر Supabase Dashboard
1. اذهب إلى Authentication > Users
2. اضغط "Add User"
3. أدخل البريد وكلمة المرور
4. في Metadata، أضف:
   ```json
   {
     "name": "Admin",
     "role": "admin"
   }
   ```

#### الطريقة 2: عبر API
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePassword123",
    "name": "Admin User",
    "role": "admin"
  }'
```

### 6. تحديث Frontend

التطبيق الآن محمي تلقائياً:
- عند فتح الموقع، سيظهر صفحة تسجيل الدخول
- بعد تسجيل الدخول، يمكن الوصول للواجهة
- جميع الـ APIs محمية بـ JWT

## استخدام النظام

### تسجيل الدخول
1. افتح الموقع
2. أدخل البريد وكلمة المرور
3. اضغط "تسجيل الدخول"

### إنشاء حساب جديد
1. في صفحة تسجيل الدخول، اضغط "إنشاء حساب"
2. أدخل الاسم، البريد، وكلمة المرور
3. سيتم إنشاء حساب بـ role "user" افتراضياً

### تسجيل الخروج
- اضغط زر "Logout" في الـ Header

## حماية الـ APIs

جميع الـ endpoints محمية الآن باستثناء:
- `POST /auth/login` - تسجيل الدخول
- `POST /auth/register` - التسجيل
- `POST /webhooks/whatsapp` - Webhook (محمي بـ webhook-token)

### استخدام Roles في Controllers

```typescript
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('courts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CourtsController {
  @Post()
  @Roles('admin', 'manager')
  create(@Body() dto: CreateCourtDto) {
    // Only admin and manager can create
  }
}
```

## RLS Policies

تم تحديث RLS Policies في Supabase:
- **Courts**: الجميع يمكنهم المشاهدة، Admin/Manager يمكنهم الإدارة
- **Players**: الجميع يمكنهم المشاهدة، Admin/Manager يمكنهم الإدارة
- **Matches**: الجميع يمكنهم المشاهدة، Admin/Manager يمكنهم الإنشاء/التعديل
- **Invitations**: الجميع يمكنهم المشاهدة، Admin/Manager يمكنهم الإدارة
- **Payments**: المستخدمون يمكنهم رؤية مدفوعاتهم، Admin/Manager يمكنهم رؤية الكل

## ملاحظات أمنية

1. **JWT_SECRET**: يجب تغييره في الإنتاج
2. **Password Policy**: يمكن إضافة سياسة أقوى في Supabase Auth Settings
3. **Rate Limiting**: يُنصح بإضافة rate limiting للـ endpoints
4. **HTTPS**: استخدم HTTPS في الإنتاج دائماً

## استكشاف الأخطاء

### "Unauthorized" عند الوصول للـ APIs
- تأكد من تسجيل الدخول
- تحقق من وجود token في localStorage
- تأكد من صحة JWT_SECRET

### "User not found" بعد التسجيل
- تحقق من trigger `on_auth_user_created`
- تأكد من تشغيل `auth-schema.sql`

### لا يمكن الوصول للواجهة
- تأكد من تسجيل الدخول
- تحقق من console للأخطاء
- تأكد من اتصال Backend

