# Hyke It Up — Supabase email templates

Paste each into **Supabase → Authentication → Emails → Templates**.
Keep the `{{ .ConfirmationURL }}` placeholder exactly as written.

---

## Confirm signup

**Subject:** Confirm your Hyke It Up account

```html
<div style="background:#0B0B0B;padding:40px 16px;font-family:Helvetica,Arial,sans-serif;color:#F5F2EC">
  <div style="max-width:520px;margin:0 auto;background:#141414;border:1px solid #2a2a2a;border-radius:6px;padding:36px 32px">
    <p style="margin:0 0 6px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#E06840">Hyke It Up</p>
    <h1 style="margin:0 0 16px;font-size:30px;line-height:1.05;letter-spacing:-1px;color:#F5F2EC">Confirm your email<span style="color:#D44F2C">.</span></h1>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#A39E96">
      Welcome to the community! Click below to verify your email address and activate your account.
    </p>
    <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#D44F2C;color:#F5F2EC;text-decoration:none;font-weight:600;font-size:13px;letter-spacing:1.5px;text-transform:uppercase;padding:14px 26px;border-radius:999px">Confirm my account</a>
    <p style="margin:28px 0 0;font-size:12px;line-height:1.6;color:#6f6a63">
      Didn't sign up? You can safely ignore this email.
    </p>
  </div>
</div>
```

---

## Reset password

**Subject:** Reset your Hyke It Up password

```html
<div style="background:#0B0B0B;padding:40px 16px;font-family:Helvetica,Arial,sans-serif;color:#F5F2EC">
  <div style="max-width:520px;margin:0 auto;background:#141414;border:1px solid #2a2a2a;border-radius:6px;padding:36px 32px">
    <p style="margin:0 0 6px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#E06840">Hyke It Up</p>
    <h1 style="margin:0 0 16px;font-size:30px;line-height:1.05;letter-spacing:-1px;color:#F5F2EC">Reset your password<span style="color:#D44F2C">.</span></h1>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#A39E96">
      We received a request to reset your password. Click below to choose a new one. This link expires in 1 hour.
    </p>
    <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#D44F2C;color:#F5F2EC;text-decoration:none;font-weight:600;font-size:13px;letter-spacing:1.5px;text-transform:uppercase;padding:14px 26px;border-radius:999px">Choose a new password</a>
    <p style="margin:28px 0 0;font-size:12px;line-height:1.6;color:#6f6a63">
      Didn't ask for this? Ignore this email — your password won't change.
    </p>
  </div>
</div>
```

---

## Change email address

**Subject:** Confirm your new Hyke It Up email

```html
<div style="background:#0B0B0B;padding:40px 16px;font-family:Helvetica,Arial,sans-serif;color:#F5F2EC">
  <div style="max-width:520px;margin:0 auto;background:#141414;border:1px solid #2a2a2a;border-radius:6px;padding:36px 32px">
    <p style="margin:0 0 6px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#E06840">Hyke It Up</p>
    <h1 style="margin:0 0 16px;font-size:30px;line-height:1.05;letter-spacing:-1px;color:#F5F2EC">Confirm your new email<span style="color:#D44F2C">.</span></h1>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#A39E96">
      Click below to confirm {{ .NewEmail }} as the email for your Hyke It Up account.
    </p>
    <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#D44F2C;color:#F5F2EC;text-decoration:none;font-weight:600;font-size:13px;letter-spacing:1.5px;text-transform:uppercase;padding:14px 26px;border-radius:999px">Confirm new email</a>
  </div>
</div>
```

---

## Password changed (security notification)

If your project shows **Authentication → Emails → Security notifications → Password changed**,
switch it on so members get an email confirming every password change.
