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

export const accountCredentialsTemplate = ({ email, password }) => `
  <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.05); padding: 30px;">

      <h2 style="color: #2c3e50;">Your TalentBox Account Has Been Created</h2>

      <p style="color: #555; font-size: 15px; line-height: 1.6;">
        An administrator has created your TalentBox account. Below are your login credentials:
      </p>

      <ul style="color: #555; font-size: 15px; line-height: 1.6;">
        <li><strong>Email:</strong> ${email}</li>
        <li><strong>Password:</strong> ${password}</li>
      </ul>

      <p style="color: #555; font-size: 15px; line-height: 1.6;">
        We recommend that you change your password after logging in for the first time.
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONT_URL}" 
           style="background-color: #007bff; color: #ffffff; padding: 12px 24px; border-radius: 4px; text-decoration: none; font-weight: bold;">
          Login to Your Account
        </a>
      </div>

      <p style="color: #555; font-size: 14px;">
        If you have any questions or face issues logging in, feel free to reach out to your administrator or support team.
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

export const jobCreatedTemplate = ({
  createdBy,
  role,
  jobTitle,
  startDate,
  endDate,
  createdAt,
}) => `
  <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
    <div style="max-width: 650px; margin: auto; background-color: #fff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); padding: 30px;">
      
      <h2 style="color: #2c3e50; margin-bottom: 20px;">📢 New Job Created</h2>

      <p style="color: #444; font-size: 15px;">Dear Admin,</p>

      <p style="color: #444; font-size: 15px; line-height: 1.6;">
        A new job has been created on the TalentBox platform. Below are the details:
      </p>

      <table style="width:100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
        <tr>
          <td style="padding: 8px; border: 1px solid #eee;"><strong>Created By</strong></td>
          <td style="padding: 8px; border: 1px solid #eee;">${createdBy} (${role})</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #eee;"><strong>Job Title</strong></td>
          <td style="padding: 8px; border: 1px solid #eee;">${jobTitle}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #eee;"><strong>Start Date</strong></td>
          <td style="padding: 8px; border: 1px solid #eee;">${
            startDate || '-'
          }</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #eee;"><strong>End Date</strong></td>
          <td style="padding: 8px; border: 1px solid #eee;">${
            endDate || '-'
          }</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #eee;"><strong>Created At</strong></td>
          <td style="padding: 8px; border: 1px solid #eee;">${createdAt}</td>
        </tr>
      </table>

      <p style="margin-top: 30px; color: #666; font-size: 14px;">
        Regards,<br/>
        <strong>The TalentBox Team</strong>
      </p>

      <hr style="border: none; border-top: 1px solid #eee; margin: 40px 0;" />

      <p style="color: #aaa; font-size: 12px; text-align: center;">
        This is an automated notification. Please do not reply directly to this email.
      </p>
    </div>
  </div>
`;

export const passwordResetRequestTemplate = ({ email }) => `
  <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background-color: #fff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); padding: 30px;">
      <h2 style="color: #2c3e50;">Password Reset Requested</h2>

      <p style="color: #444; font-size: 15px; line-height: 1.6;">
        This is to inform you that a user with the following email has requested to reset their TalentBox password:
      </p>

      <ul style="color: #444; font-size: 15px;">
        <li><strong>User Email:</strong> ${email}</li>
      </ul>

      <p style="color: #444; font-size: 15px; line-height: 1.6;">
        Please take appropriate action and reset the user's password. You can use the button below to proceed.
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="https://tb-front.vercel.app/update-password"
           target="_blank"
           style="background-color: #007bff; color: #fff; padding: 12px 24px; border-radius: 4px; text-decoration: none; font-weight: bold;">
          Reset User Password
        </a>
      </div>

      <p style="margin-top: 30px; color: #666; font-size: 14px;">
        Regards,<br/>
        <strong>TalentBox Automated Notification</strong>
      </p>

      <hr style="border: none; border-top: 1px solid #eee; margin: 40px 0;" />

      <p style="color: #aaa; font-size: 12px; text-align: center;">
        This message was sent automatically. Do not reply directly to this email.
      </p>
    </div>
  </div>
`;

export const resetPasswordCredentialsTemplate = ({ email, password }) => `
  <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background-color: #fff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); padding: 30px;">
      <h2 style="color: #2c3e50;">Your Password Has Been Reset</h2>

      <p style="color: #444; font-size: 15px; line-height: 1.6;">
        Your TalentBox password has been reset by the administrator. Please find your updated credentials below:
      </p>

      <ul style="color: #444; font-size: 15px;">
        <li><strong>Email:</strong> ${email}</li>
        <li><strong>New Password:</strong> ${password}</li>
      </ul>

      <p style="color: #444; font-size: 15px; line-height: 1.6;">
        You can now log in using the credentials above. For security reasons, we strongly recommend updating your password after logging in.
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONT_URL}" 
           style="background-color: #28a745; color: #ffffff; padding: 12px 24px; border-radius: 4px; text-decoration: none; font-weight: bold;">
          Login to Your Account
        </a>
      </div>

      <p style="margin-top: 30px; color: #666; font-size: 14px;">
        Regards,<br/>
        <strong>The TalentBox Team</strong>
      </p>

      <hr style="border: none; border-top: 1px solid #eee; margin: 40px 0;" />

      <p style="color: #aaa; font-size: 12px; text-align: center;">
        This is an automated email. Do not reply directly to this message.
      </p>
    </div>
  </div>
`;

export const vendorRegistrationRequestTemplate = ({
  userName,
  email,
  companyName,
  companyEmail,
  whatsappNumber,
  companyLocation,
  companyType,
  hireResources,
  qrCodeHtml,
}) => `
  <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.05); padding: 30px;">
      <h2 style="color: #2c3e50;">New Vendor Registration – Approval Required</h2>

      <p style="color: #555; font-size: 15px;">Dear HR Team,</p>

      <p style="color: #555; font-size: 15px; line-height: 1.6;">
        A new vendor has submitted their registration on the TalentBox platform. The account is currently <strong>pending approval</strong> and requires your verification to proceed.
      </p>

      <div style="background-color: #f1f1f1; padding: 15px; border-radius: 6px; margin: 20px 0; font-size: 14px;">
        <h3 style="color: #2c3e50; margin-top: 0;">Vendor Information:</h3>
        <p><strong>User Name:</strong> ${userName || 'N/A'}</p>
        <p><strong>Email:</strong> ${email || 'N/A'}</p>
        <p><strong>Company Name:</strong> ${companyName || 'N/A'}</p>
        <p><strong>Company Email:</strong> ${companyEmail || 'N/A'}</p>
        <p><strong>WhatsApp Number:</strong> ${whatsappNumber || 'N/A'}</p>
        <p><strong>Company Location:</strong> ${companyLocation || 'N/A'}</p>
        <p><strong>Company Type:</strong> ${companyType || 'N/A'}</p>
        <p><strong>Hire Resources:</strong> ${hireResources || 'N/A'}</p>
        <p><strong>Account Status:</strong> <span style="color: #ff9800;">Pending Approval</span></p>
      </div>

      ${qrCodeHtml || ''}

      <p style="color: #555; font-size: 15px;">
        Please review the vendor information and take appropriate action from the admin panel.
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.ADMIN_PANEL_URL || process.env.FRONT_URL}" 
           style="background-color: #007bff; color: #ffffff; padding: 12px 24px; border-radius: 4px; text-decoration: none; font-weight: bold;">
          Review & Approve Vendor
        </a>
      </div>

      <p style="color: #555; font-size: 14px;">
        If you believe this registration is not valid or needs clarification, please follow up as necessary with the vendor or support team.
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

export const vendorApprovalWithCredentialsTemplate = ({
  userName,
  email,
  password,
  role,
}) => `
  <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.05); padding: 30px;">
      <h2 style="color: #2c3e50;">Account Approved – Welcome to TalentBox</h2>

      <p style="color: #555; font-size: 15px;">Dear ${userName || 'User'},</p>

      <p style="color: #555; font-size: 15px; line-height: 1.6;">
        We're pleased to inform you that your TalentBox ${
          role || 'account'
        } has been successfully reviewed and <strong>approved</strong> by the administrator.
        You can now log in and begin managing your activities.
      </p>

      <div style="background-color: #f1f1f1; padding: 15px; border-radius: 6px; margin: 20px 0; font-size: 14px;">
        <h3 style="color: #2c3e50; margin-top: 0;">Your Login Credentials:</h3>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Temporary Password:</strong> <code style="background-color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 16px; font-weight: bold; color: #2c3e50;">${password}</code></p>
      </div>

      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="color: #856404; font-size: 14px; margin: 0; font-weight: bold;">⚠️ Important Security Instructions:</p>
        <ul style="color: #856404; font-size: 14px; margin: 10px 0 0 20px; padding-left: 0;">
          <li style="margin-bottom: 8px;">This is a <strong>temporary password</strong> for your first login.</li>
          <li style="margin-bottom: 8px;">You <strong>must change your password</strong> immediately after logging in for the first time.</li>
          <li style="margin-bottom: 8px;">Do not share your password with anyone.</li>
          <li>If you have any issues logging in, please contact the support team.</li>
        </ul>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONT_URL}" 
           style="background-color: #28a745; color: #ffffff; padding: 12px 24px; border-radius: 4px; text-decoration: none; font-weight: bold; display: inline-block;">
          Login to Your Account
        </a>
      </div>

      <p style="color: #555; font-size: 14px; line-height: 1.6;">
        <strong>Next Steps:</strong><br/>
        1. Click the button above to log in to your account<br/>
        2. Use the temporary password provided above<br/>
        3. Navigate to your profile settings and change your password immediately<br/>
        4. Start exploring and managing your ${role || 'account'} on TalentBox
      </p>

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

export const jobNotificationTemplate = ({
  jobTitle,
  jobSubject,
  jobId,
  hrEmail,
  applicationUrl,
}) => `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px;">
    <div style="max-width: 650px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.15); overflow: hidden;">
      
      <!-- Header Section -->
      <div style="background: #667eea; padding: 40px 30px; text-align: center;">
        <h1 style="color: #ffffff !important; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 0.5px; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
          🎯 New Job Opportunity!
        </h1>
        <p style="color: #ffffff !important; margin: 10px 0 0 0; font-size: 16px; font-weight: 500; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">
          A Perfect Match for Your Skills
        </p>
      </div>

      <!-- Content Section -->
      <div style="padding: 40px 30px;">
        <p style="color: #555; font-size: 16px; line-height: 1.8; margin: 0 0 30px 0;">
          We found an exciting job opportunity that matches your skills and experience. This could be your next career move!
        </p>

        <!-- Job Details Card -->
        <div style="background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); padding: 30px; border-radius: 10px; margin: 0 0 30px 0; border-left: 5px solid #667eea;">
          <h2 style="color: #2c3e50; margin: 0 0 20px 0; font-size: 22px; font-weight: 600;">
            📋 Job Details
          </h2>
          <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px 0; color: #555; font-size: 15px; font-weight: 600; width: 40%;">Position:</td>
                <td style="padding: 12px 0; color: #2c3e50; font-size: 15px; font-weight: 500;">${
                  jobTitle || jobSubject || 'N/A'
                }</td>
              </tr>
            </table>
          </div>
        </div>

        <!-- Buttons Section -->
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONT_URL}master/job3/${
  jobId || ''
}?source=email" target="_blank"
             style="display: inline-block; background-color: #667eea !important; color: #ffffff !important; padding: 16px 32px; border-radius: 50px; text-decoration: none; font-weight: 700; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); border: 2px solid #667eea; margin: 5px;">
            <span style="color: #ffffff !important; text-decoration: none;">👁️ View Job Details</span>
          </a>
          <a href="${
            applicationUrl
              ? applicationUrl +
                (applicationUrl.includes('?') ? '&' : '?') +
                'source=email'
              : '#'
          }" target="_blank"
             style="display: inline-block; background-color: #28a745 !important; color: #ffffff !important; padding: 16px 32px; border-radius: 50px; text-decoration: none; font-weight: 700; font-size: 16px; box-shadow: 0 4px 15px rgba(40, 167, 69, 0.4); border: 2px solid #28a745; margin: 5px;">
            <span style="color: #ffffff !important; text-decoration: none;">🚀 Apply Now</span>
          </a>
        </div>

        <p style="color: #666; font-size: 14px; line-height: 1.8; margin: 30px 0 0 0;">
          If you're interested in this position, don't miss this opportunity! Click the buttons above to view complete job details and apply.
        </p>

        <!-- HR Contact Section -->
        <div style="background-color: #e8f4f8; border-left: 4px solid #667eea; padding: 15px 20px; margin: 20px 0; border-radius: 8px;">
          <p style="color: #004085; font-size: 14px; margin: 0; line-height: 1.6;">
            <strong>📧 Need Help?</strong> Contact our HR team at: 
            <a href="mailto:${
              hrEmail || 'hr@talentbox.com'
            }" style="color: #667eea; text-decoration: none; font-weight: 600;">${
  hrEmail || 'hr@talentbox.com'
}</a>
          </p>
        </div>
      </div>

      <!-- Footer Section -->
      <div style="background-color: #f8f9fa; padding: 25px 30px; border-top: 1px solid #e9ecef;">
        <p style="margin: 0 0 10px 0; color: #555; font-size: 14px;">
          Best regards,<br/>
          <strong style="color: #2c3e50;">The TalentBox Team</strong>
        </p>
        <hr style="border: none; border-top: 1px solid #dee2e6; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
          This is an automated message. Please do not reply directly to this email.
        </p>
      </div>
    </div>
  </div>
`;

// Applicant Status Change Email Templates

// Template for notifying Vendor when Client changes applicant status
export const applicantStatusChangeToVendorTemplate = ({
  vendorName,
  applicantName,
  applicantEmail,
  jobTitle,
  oldStatus,
  newStatus,
  clientName,
  changedBy,
  changedAt,
  dashboardUrl,
}) => `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px;">
    <div style="max-width: 650px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.15); overflow: hidden;">
      
      <!-- Header Section -->
      <div style="background: #667eea; padding: 40px 30px; text-align: center;">
        <h1 style="color: #ffffff !important; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 0.5px; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
          📋 Applicant Status Updated
        </h1>
        <p style="color: #ffffff !important; margin: 10px 0 0 0; font-size: 16px; font-weight: 500; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">
          Status Change Notification
        </p>
      </div>

      <!-- Content Section -->
      <div style="padding: 40px 30px;">
        <p style="color: #555; font-size: 16px; line-height: 1.8; margin: 0 0 30px 0;">
          Dear ${vendorName || 'Vendor'},
        </p>
        <p style="color: #555; font-size: 16px; line-height: 1.8; margin: 0 0 30px 0;">
          The status of an applicant you submitted has been updated. Please find the details below:
        </p>

        <!-- Applicant Details Card -->
        <div style="background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); padding: 30px; border-radius: 10px; margin: 0 0 30px 0; border-left: 5px solid #667eea;">
          <h2 style="color: #2c3e50; margin: 0 0 20px 0; font-size: 22px; font-weight: 600;">
            👤 Applicant Details
          </h2>
          <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px 0; color: #555; font-size: 15px; font-weight: 600; width: 40%;">Applicant Name:</td>
                <td style="padding: 12px 0; color: #2c3e50; font-size: 15px; font-weight: 500;">${
                  applicantName || 'N/A'
                }</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #555; font-size: 15px; font-weight: 600;">Applicant Email:</td>
                <td style="padding: 12px 0; color: #2c3e50; font-size: 15px;">${
                  applicantEmail || 'N/A'
                }</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #555; font-size: 15px; font-weight: 600;">Job Position:</td>
                <td style="padding: 12px 0; color: #2c3e50; font-size: 15px;">${
                  jobTitle || 'N/A'
                }</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #555; font-size: 15px; font-weight: 600;">Previous Status:</td>
                <td style="padding: 12px 0; color: #dc3545; font-size: 15px; font-weight: 500;">${
                  oldStatus || 'N/A'
                }</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #555; font-size: 15px; font-weight: 600;">New Status:</td>
                <td style="padding: 12px 0; color: #28a745; font-size: 15px; font-weight: 600;">${
                  newStatus || 'N/A'
                }</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #555; font-size: 15px; font-weight: 600;">Changed By:</td>
                <td style="padding: 12px 0; color: #2c3e50; font-size: 15px;">${
                  changedBy || 'N/A'
                }</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #555; font-size: 15px; font-weight: 600;">Changed At:</td>
                <td style="padding: 12px 0; color: #2c3e50; font-size: 15px;">${
                  changedAt || 'N/A'
                }</td>
              </tr>
            </table>
          </div>
        </div>

        <!-- Dashboard Button Section -->
        <div style="text-align: center; margin: 30px 0;">
          <a href="${dashboardUrl || '#'}" 
             style="display: inline-block; background-color: #667eea !important; color: #ffffff !important; padding: 16px 40px; border-radius: 50px; text-decoration: none; font-weight: 700; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); border: 2px solid #667eea;">
            <span style="color: #ffffff !important; text-decoration: none;">🔗 View in Dashboard</span>
          </a>
        </div>
      </div>

      <!-- Footer Section -->
      <div style="background-color: #f8f9fa; padding: 25px 30px; border-top: 1px solid #e9ecef;">
        <p style="margin: 0 0 10px 0; color: #555; font-size: 14px;">
          Best regards,<br/>
          <strong style="color: #2c3e50;">${
            clientName || 'The TalentBox Team'
          }</strong>
        </p>
        <hr style="border: none; border-top: 1px solid #dee2e6; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
          This is an automated message. Please do not reply directly to this email.
        </p>
      </div>
    </div>
  </div>
`;

// Template for notifying Admin when applicant is selected (Client role)
export const applicantSelectedToAdminTemplate = ({
  applicantName,
  applicantEmail,
  jobTitle,
  jobId,
  vendorName,
  vendorEmail,
  clientName,
  clientEmail,
  selectedAt,
  dashboardUrl,
}) => `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px 20px;">
    <div style="max-width: 650px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.15); overflow: hidden;">
      
      <!-- Header Section -->
      <div style="background: #28a745; padding: 40px 30px; text-align: center;">
        <h1 style="color: #ffffff !important; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 0.5px; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
          🎉 Applicant Selected!
        </h1>
        <p style="color: #ffffff !important; margin: 10px 0 0 0; font-size: 16px; font-weight: 500; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">
          A candidate has been selected for a job
        </p>
      </div>

      <!-- Content Section -->
      <div style="padding: 40px 30px;">
        <p style="color: #555; font-size: 16px; line-height: 1.8; margin: 0 0 30px 0;">
          Dear Admin,
        </p>
        <p style="color: #555; font-size: 16px; line-height: 1.8; margin: 0 0 30px 0;">
          Great news! An applicant has been selected for a job position. Please find the details below:
        </p>

        <!-- Selection Details Card -->
        <div style="background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%); padding: 30px; border-radius: 10px; margin: 0 0 30px 0; border-left: 5px solid #28a745;">
          <h2 style="color: #155724; margin: 0 0 20px 0; font-size: 22px; font-weight: 600;">
            ✅ Selection Details
          </h2>
          <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px 0; color: #555; font-size: 15px; font-weight: 600; width: 40%;">Applicant Name:</td>
                <td style="padding: 12px 0; color: #2c3e50; font-size: 15px; font-weight: 500;">${
                  applicantName || 'N/A'
                }</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #555; font-size: 15px; font-weight: 600;">Applicant Email:</td>
                <td style="padding: 12px 0; color: #2c3e50; font-size: 15px;">${
                  applicantEmail || 'N/A'
                }</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #555; font-size: 15px; font-weight: 600;">Job Position:</td>
                <td style="padding: 12px 0; color: #2c3e50; font-size: 15px;">${
                  jobTitle || 'N/A'
                }</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #555; font-size: 15px; font-weight: 600;">Job ID:</td>
                <td style="padding: 12px 0; color: #2c3e50; font-size: 15px;">${
                  jobId || 'N/A'
                }</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #555; font-size: 15px; font-weight: 600;">Vendor Name:</td>
                <td style="padding: 12px 0; color: #2c3e50; font-size: 15px;">${
                  vendorName || 'N/A'
                }</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #555; font-size: 15px; font-weight: 600;">Vendor Email:</td>
                <td style="padding: 12px 0; color: #2c3e50; font-size: 15px;">${
                  vendorEmail || 'N/A'
                }</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #555; font-size: 15px; font-weight: 600;">Client Name:</td>
                <td style="padding: 12px 0; color: #2c3e50; font-size: 15px;">${
                  clientName || 'N/A'
                }</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #555; font-size: 15px; font-weight: 600;">Selected At:</td>
                <td style="padding: 12px 0; color: #2c3e50; font-size: 15px;">${
                  selectedAt || 'N/A'
                }</td>
              </tr>
            </table>
          </div>
        </div>

        <!-- Dashboard Button Section -->
        <div style="text-align: center; margin: 30px 0;">
          <a href="${dashboardUrl || '#'}" 
             style="display: inline-block; background-color: #28a745 !important; color: #ffffff !important; padding: 16px 40px; border-radius: 50px; text-decoration: none; font-weight: 700; font-size: 16px; box-shadow: 0 4px 15px rgba(40, 167, 69, 0.4); border: 2px solid #28a745;">
            <span style="color: #ffffff !important; text-decoration: none;">📊 View in Dashboard</span>
          </a>
        </div>
      </div>

      <!-- Footer Section -->
      <div style="background-color: #f8f9fa; padding: 25px 30px; border-top: 1px solid #e9ecef;">
        <p style="margin: 0 0 10px 0; color: #555; font-size: 14px;">
          Best regards,<br/>
          <strong style="color: #2c3e50;">The TalentBox Team</strong>
        </p>
        <hr style="border: none; border-top: 1px solid #dee2e6; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
          This is an automated message. Please do not reply directly to this email.
        </p>
      </div>
    </div>
  </div>
`;

// Template for notifying Vendor when their applicant status changes (Vendor role update confirmation)
export const vendorApplicantStatusUpdateTemplate = ({
  vendorName,
  applicantName,
  applicantEmail,
  jobTitle,
  oldStatus,
  newStatus,
  updatedAt,
  dashboardUrl,
}) => `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px;">
    <div style="max-width: 650px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.15); overflow: hidden;">
      
      <!-- Header Section -->
      <div style="background: #667eea; padding: 40px 30px; text-align: center;">
        <h1 style="color: #ffffff !important; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 0.5px; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
          ✅ Status Update Confirmed
        </h1>
        <p style="color: #ffffff !important; margin: 10px 0 0 0; font-size: 16px; font-weight: 500; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">
          Your applicant status has been updated
        </p>
      </div>

      <!-- Content Section -->
      <div style="padding: 40px 30px;">
        <p style="color: #555; font-size: 16px; line-height: 1.8; margin: 0 0 30px 0;">
          Dear ${vendorName || 'Vendor'},
        </p>
        <p style="color: #555; font-size: 16px; line-height: 1.8; margin: 0 0 30px 0;">
          This is to confirm that you have successfully updated the status of an applicant. Please find the details below:
        </p>

        <!-- Update Details Card -->
        <div style="background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); padding: 30px; border-radius: 10px; margin: 0 0 30px 0; border-left: 5px solid #667eea;">
          <h2 style="color: #2c3e50; margin: 0 0 20px 0; font-size: 22px; font-weight: 600;">
            📝 Update Details
          </h2>
          <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px 0; color: #555; font-size: 15px; font-weight: 600; width: 40%;">Applicant Name:</td>
                <td style="padding: 12px 0; color: #2c3e50; font-size: 15px; font-weight: 500;">${
                  applicantName || 'N/A'
                }</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #555; font-size: 15px; font-weight: 600;">Applicant Email:</td>
                <td style="padding: 12px 0; color: #2c3e50; font-size: 15px;">${
                  applicantEmail || 'N/A'
                }</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #555; font-size: 15px; font-weight: 600;">Job Position:</td>
                <td style="padding: 12px 0; color: #2c3e50; font-size: 15px;">${
                  jobTitle || 'N/A'
                }</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #555; font-size: 15px; font-weight: 600;">Previous Status:</td>
                <td style="padding: 12px 0; color: #dc3545; font-size: 15px; font-weight: 500;">${
                  oldStatus || 'N/A'
                }</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #555; font-size: 15px; font-weight: 600;">New Status:</td>
                <td style="padding: 12px 0; color: #28a745; font-size: 15px; font-weight: 600;">${
                  newStatus || 'N/A'
                }</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #555; font-size: 15px; font-weight: 600;">Updated At:</td>
                <td style="padding: 12px 0; color: #2c3e50; font-size: 15px;">${
                  updatedAt || 'N/A'
                }</td>
              </tr>
            </table>
          </div>
        </div>

        <!-- Dashboard Button Section -->
        <div style="text-align: center; margin: 30px 0;">
          <a href="${dashboardUrl || '#'}" 
             style="display: inline-block; background-color: #667eea !important; color: #ffffff !important; padding: 16px 40px; border-radius: 50px; text-decoration: none; font-weight: 700; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); border: 2px solid #667eea;">
            <span style="color: #ffffff !important; text-decoration: none;">🔗 View in Dashboard</span>
          </a>
        </div>
      </div>

      <!-- Footer Section -->
      <div style="background-color: #f8f9fa; padding: 25px 30px; border-top: 1px solid #e9ecef;">
        <p style="margin: 0 0 10px 0; color: #555; font-size: 14px;">
          Best regards,<br/>
          <strong style="color: #2c3e50;">The TalentBox Team</strong>
        </p>
        <hr style="border: none; border-top: 1px solid #dee2e6; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
          This is an automated message. Please do not reply directly to this email.
        </p>
      </div>
    </div>
  </div>
`;

export const vendorJobNotificationTemplate = ({
  jobTitle,
  jobSubject,
  jobId,
  hrEmail,
}) => `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px;">
    <div style="max-width: 650px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.15); overflow: hidden;">
      
      <!-- Header Section -->
      <div style="background: #667eea; padding: 40px 30px; text-align: center;">
        <h1 style="color: #ffffff !important; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 0.5px; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
          🎯 New Job Added!
        </h1>
        <p style="color: #ffffff !important; margin: 10px 0 0 0; font-size: 16px; font-weight: 500; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">
          A New Opportunity for Your Network
        </p>
      </div>

      <!-- Content Section -->
      <div style="padding: 40px 30px;">
        <p style="color: #555; font-size: 16px; line-height: 1.8; margin: 0 0 30px 0;">
          A new job has been added that might interest you. Click below to view the complete job details and share it with your network of applicants.
        </p>

        <!-- Job Details Card -->
        <div style="background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); padding: 30px; border-radius: 10px; margin: 0 0 30px 0; border-left: 5px solid #667eea;">
          <h2 style="color: #2c3e50; margin: 0 0 20px 0; font-size: 22px; font-weight: 600;">
            📋 Job Details
          </h2>
          <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px 0; color: #555; font-size: 15px; font-weight: 600; width: 40%;">Position:</td>
                <td style="padding: 12px 0; color: #2c3e50; font-size: 15px; font-weight: 500;">${
                  jobTitle || jobSubject || 'N/A'
                }</td>
              </tr>
            </table>
          </div>
        </div>

        <!-- Buttons Section -->
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONT_URL}master/job3/${
  jobId || ''
}?source=email" target="_blank"
             style="display: inline-block; background-color: #667eea !important; color: #ffffff !important; padding: 16px 32px; border-radius: 50px; text-decoration: none; font-weight: 700; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); border: 2px solid #667eea; margin: 5px;">
            <span style="color: #ffffff !important; text-decoration: none;">👁️ View Job Details</span>
          </a>
          <a href="${process.env.FRONT_URL}" target="_blank"
             style="display: inline-block; background-color: #28a745 !important; color: #ffffff !important; padding: 16px 32px; border-radius: 50px; text-decoration: none; font-weight: 700; font-size: 16px; box-shadow: 0 4px 15px rgba(40, 167, 69, 0.4); border: 2px solid #28a745; margin: 5px;">
            <span style="color: #ffffff !important; text-decoration: none;">🔐 Login to View Job</span>
          </a>
        </div>

        <p style="color: #666; font-size: 14px; line-height: 1.8; margin: 30px 0 0 0;">
          This job opportunity is now available. Click the buttons above to view the full details and start connecting with potential candidates.
        </p>

        <!-- HR Contact Section -->
        <div style="background-color: #e8f4f8; border-left: 4px solid #667eea; padding: 15px 20px; margin: 20px 0; border-radius: 8px;">
          <p style="color: #004085; font-size: 14px; margin: 0; line-height: 1.6;">
            <strong>📧 Need Help?</strong> Contact our HR team at: 
            <a href="mailto:${
              hrEmail || 'hr@talentbox.com'
            }" style="color: #667eea; text-decoration: none; font-weight: 600;">${
  hrEmail || 'hr@talentbox.com'
}</a>
          </p>
        </div>
      </div>

      <!-- Footer Section -->
      <div style="background-color: #f8f9fa; padding: 25px 30px; border-top: 1px solid #e9ecef;">
        <p style="margin: 0 0 10px 0; color: #555; font-size: 14px;">
          Best regards,<br/>
          <strong style="color: #2c3e50;">The TalentBox Team</strong>
        </p>
        <hr style="border: none; border-top: 1px solid #dee2e6; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
          This is an automated message. Please do not reply directly to this email.
        </p>
      </div>
    </div>
  </div>
`;
