export const approvalRequestTemplate = ({ userName, email, role }) => `
  <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.05); padding: 30px;">
      <h2 style="color: #2c3e50;">New User Registration – Approval Required</h2>

      <p style="color: #555; font-size: 15px;">Dear Admin,</p>

      <p style="color: #555; font-size: 15px; line-height: 1.6;">
        A new user has completed the registration process on the TalentBox platform. The account is currently <strong>pending approval</strong> and requires your verification to proceed.
      </p>

      <div style="background-color: #f1f1f1; padding: 15px; border-radius: 6px; margin: 20px 0; font-size: 14px;">
        <p><strong>User Name:</strong> ${userName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Requested Role:</strong> ${role}</p>
        <p><strong>Account Status:</strong> Pending Approval</p>
      </div>

      <p style="color: #555; font-size: 15px;">
        Please review the request and take appropriate action from the admin panel.
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.ADMIN_PANEL_URL}" 
           style="background-color: #007bff; color: #ffffff; padding: 12px 24px; border-radius: 4px; text-decoration: none; font-weight: bold;">
          Review & Approve User
        </a>
      </div>

      <p style="color: #555; font-size: 14px;">
        If you believe this registration is not valid or needs clarification, please follow up as necessary with the user or support team.
      </p>

      <p style="margin-top: 30px; color: #555; font-size: 14px;">
        Regards,<br/>
        <strong>The TalentBox Team</strong>
      </p>

      <hr style="border: none; border-top: 1px solid #eee; margin: 40px 0;" />

      <p style="color: #999; font-size: 12px; text-align: center;">
        This is an automated message. Please do not reply directly to this email.
      </p>
    </div>
  </div>
`;



export const accountApprovedTemplate = ({ userName }) => `
  <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.05); padding: 30px;">

      <h2 style="color: #2c3e50;">Access Granted – Welcome to TalentBox</h2>

      <p style="color: #555; font-size: 15px;">Dear ${userName || 'User'},</p>

      <p style="color: #555; font-size: 15px; line-height: 1.6;">
        We're pleased to inform you that your TalentBox account has been successfully reviewed and approved by the administrator.
        You can now log in and begin managing your activities.
      </p>

      <p style="color: #555; font-size: 15px; line-height: 1.6;">
        TalentBox enables you to stay informed, manage your profile, and perform daily tasks efficiently — all in one place.
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONT_URL}" 
           style="background-color: #28a745; color: #ffffff; padding: 12px 24px; border-radius: 4px; text-decoration: none; font-weight: bold;">
          Login to Your Account
        </a>
      </div>

      <p style="color: #555; font-size: 14px;">
        If you have any questions or need help getting started, feel free to reach out to the support team or your administrator.
      </p>

      <p style="margin-top: 30px; color: #555; font-size: 14px;">
        Regards,<br/>
        <strong>The TalentBox Team</strong>
      </p>

      <hr style="border: none; border-top: 1px solid #eee; margin: 40px 0;" />

      <p style="color: #999; font-size: 12px; text-align: center;">
        This is an automated message. Please do not reply directly to this email.
      </p>
    </div>
  </div>
`;