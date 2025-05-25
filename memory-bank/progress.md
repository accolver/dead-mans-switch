# Progress

## Tasks

- [x] Create a new Next.js app with App Router.
- [x] Create a new Supabase project.
- [x] Enable users to create secrets
- [x] Trigger reminders
- [x] Google OAuth login
- [x] Update secret details page with new Shamir's sharing
  - [x] The secret cannot be edited, but users can delete the server's share (with a notice that the other shares STILL could be used to reconstruct the secret)
  - [x] Users can choose to reveal the server's share (decrypt on the server and show on the UI). This should have a prompt first that warns the user that this share can be combined with other shares to reveal the secret and that they should only do this if they're doing it for recovery reasons
- [ ] Add unit tests
- [ ] Google Sign on
- [x] Enable users to pause and reactivate secrets
- [x] Reminders to check in
- [ ] ToS and Privacy Policy
- [ ] New secret email
- [ ] SMS reminders
- [ ] 3rd-party security audit
- [ ] Email verification for user.meta.email_verified not being set to true. Also need to enable email verify with OTP.
- [ ]  Deploy to Supabase prod and be comfortable with DB management
