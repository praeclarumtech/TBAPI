import bcrypt from 'bcryptjs';
import fs from 'fs';
import mongoose from 'mongoose';
import path from 'path';
import loadEnv from '../src/helpers/loadEnv.js';
import Role from '../src/models/roleModel.js';
import User from '../src/models/userModel.js';
import Vendor from '../src/models/vendorModel.js';
import Skills from '../src/models/skillsModel.js';
import appliedRoleModel from '../src/models/appliedRoleModel.js';
import Applicant from '../src/models/applicantModel.js';
import jobs from '../src/models/jobModel.js';
import jobApplication from '../src/models/jobApplicantionModel.js';
import Degree from '../src/models/degreeModel.js';
import designation from '../src/models/designationModel.js';
import { applicantEnum, Enum } from '../src/utils/enum.js';

process.env.NODE_ENV ||= 'test';
loadEnv();

const allowNonTest = process.argv.includes('--allow-non-test');
const shouldReset = process.argv.includes('--reset');
const seedPassword = process.env.TEST_SEED_PASSWORD || 'Test@12345';
const seedTag = 'test-seed';
const hasEnvTestFile = fs.existsSync(path.resolve(process.cwd(), '.env.test'));

if (process.env.NODE_ENV !== 'test' && !allowNonTest) {
  console.error(
    'Refusing to seed because NODE_ENV is not "test". Use NODE_ENV=test or pass --allow-non-test intentionally.'
  );
  process.exit(1);
}

if (!process.env.DBURL) {
  console.error('Missing DBURL. Set DBURL in .env.test before running the seed.');
  process.exit(1);
}

if (!hasEnvTestFile && !allowNonTest && !/test/i.test(process.env.DBURL)) {
  console.error(
    'Refusing to seed because .env.test is missing and DBURL does not look like a test database.'
  );
  console.error('Use a test DBURL containing "test" or pass --allow-non-test intentionally.');
  process.exit(1);
}

const upsertRole = async (name, accessModules) => {
  const role = await Role.findOneAndUpdate(
    { name },
    {
      $set: {
        name,
        accessModules,
        status: true,
        isDeleted: false,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return role;
};

const upsertUser = async ({ role, roleId, email, userName, firstName, lastName }) => {
  const password = await bcrypt.hash(seedPassword, 10);
  const user = await User.findOneAndUpdate(
    { email },
    {
      $set: {
        userName,
        email,
        password,
        role,
        roleId,
        firstName,
        lastName,
        isActive: true,
        isAdmin: role === Enum.ADMIN,
        passwordChanged: true,
        addedByRole: seedTag,
        state: 'Gujarat',
        city: 'Ahmedabad',
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return user;
};

const resetSeedData = async () => {
  await Promise.all([
    jobApplication.deleteMany({ email: /@test\.talentbox$/ }),
    jobs.deleteMany({ job_id: /^TEST-/ }),
    Applicant.deleteMany({ email: /@test\.talentbox$/ }),
    User.deleteMany({ email: /@test\.talentbox$/ }),
    Vendor.deleteMany({ addedByRole: seedTag }),
    appliedRoleModel.deleteMany({ appliedRole: { $in: ['MERN Stack Developer', 'QA Engineer'] } }),
    Skills.deleteMany({ skills: { $in: ['MERN Stack', 'Node.js', 'React.js', 'Manual Testing'] } }),
    Degree.deleteMany({ degree: { $in: ['B.Tech', 'MCA'] } }),
    designation.deleteMany({ designation: { $in: ['Software Engineer', 'QA Engineer'] } }),
  ]);
};

const run = async () => {
  await mongoose.connect(process.env.DBURL);

  if (shouldReset) {
    await resetSeedData();
  }

  const accessModules = [
    'dashboard',
    'applicants',
    'vendors',
    'clients',
    'email',
    'reports',
    'master',
  ];

  const [adminRole, hrRole, vendorRole, clientRole] = await Promise.all([
    upsertRole(Enum.ADMIN, accessModules),
    upsertRole(Enum.HR, ['dashboard', 'applicants', 'email', 'reports']),
    upsertRole(Enum.VENDOR, ['dashboard', 'vendor_job_listing', 'vendor_job_applicants']),
    upsertRole(Enum.CLIENT, ['dashboard', 'client_job_listing', 'client_job_applicants']),
  ]);

  const [adminUser, hrUser, vendorUser, clientUser] = await Promise.all([
    upsertUser({
      role: Enum.ADMIN,
      roleId: adminRole._id,
      email: 'admin@test.talentbox',
      userName: 'testadmin',
      firstName: 'Test',
      lastName: 'Admin',
    }),
    upsertUser({
      role: Enum.HR,
      roleId: hrRole._id,
      email: 'hr@test.talentbox',
      userName: 'testhr',
      firstName: 'Test',
      lastName: 'HR',
    }),
    upsertUser({
      role: Enum.VENDOR,
      roleId: vendorRole._id,
      email: 'vendor@test.talentbox',
      userName: 'testvendor',
      firstName: 'Test',
      lastName: 'Vendor',
    }),
    upsertUser({
      role: Enum.CLIENT,
      roleId: clientRole._id,
      email: 'client@test.talentbox',
      userName: 'testclient',
      firstName: 'Test',
      lastName: 'Client',
    }),
  ]);

  const [vendorProfile, clientProfile] = await Promise.all([
    Vendor.findOneAndUpdate(
      { userId: vendorUser._id },
      {
        $set: {
          userId: vendorUser._id,
          whatsapp_number: '9000000001',
          company_name: 'Test Vendor Pvt Ltd',
          company_email: 'vendor-company@test.talentbox',
          company_phone_number: '9000000002',
          company_location: 'Ahmedabad',
          company_type: 'both',
          hire_resources: 'all',
          company_strength: '50-100',
          company_state: 'Gujarat',
          company_city: 'Ahmedabad',
          type: Enum.VENDOR,
          addedBy: adminUser._id,
          addedByRole: seedTag,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ),
    Vendor.findOneAndUpdate(
      { userId: clientUser._id },
      {
        $set: {
          userId: clientUser._id,
          whatsapp_number: '9000000003',
          company_name: 'Test Client Pvt Ltd',
          company_email: 'client-company@test.talentbox',
          company_phone_number: '9000000004',
          company_location: 'Ahmedabad',
          company_type: 'product',
          hire_resources: 'in-house',
          company_strength: '100-500',
          company_state: 'Gujarat',
          company_city: 'Ahmedabad',
          type: Enum.CLIENT,
          addedBy: adminUser._id,
          addedByRole: seedTag,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ),
  ]);

  await Promise.all([
    User.updateOne({ _id: vendorUser._id }, { $set: { vendorProfileId: vendorProfile._id } }),
    User.updateOne({ _id: clientUser._id }, { $set: { vendorProfileId: clientProfile._id } }),
  ]);

  const skillNames = ['MERN Stack', 'Node.js', 'React.js', 'Manual Testing'];
  const skills = await Promise.all(
    skillNames.map((skill) =>
      Skills.findOneAndUpdate(
        { skills: skill },
        { $set: { skills: skill, isDeleted: false } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    )
  );

  await Promise.all([
    Degree.findOneAndUpdate(
      { degree: 'B.Tech' },
      { $set: { degree: 'B.Tech', isDeleted: false } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ),
    Degree.findOneAndUpdate(
      { degree: 'MCA' },
      { $set: { degree: 'MCA', isDeleted: false } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ),
    designation.findOneAndUpdate(
      { designation: 'Software Engineer' },
      { $set: { designation: 'Software Engineer', isDeleted: false } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ),
    designation.findOneAndUpdate(
      { designation: 'QA Engineer' },
      { $set: { designation: 'QA Engineer', isDeleted: false } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ),
  ]);

  await Promise.all([
    appliedRoleModel.findOneAndUpdate(
      { appliedRole: 'MERN Stack Developer' },
      {
        $set: {
          appliedRole: 'MERN Stack Developer',
          skill: skills.slice(0, 3).map((skill) => skill._id),
          isDeleted: false,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ),
    appliedRoleModel.findOneAndUpdate(
      { appliedRole: 'QA Engineer' },
      {
        $set: {
          appliedRole: 'QA Engineer',
          skill: [skills[3]._id],
          isDeleted: false,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ),
  ]);

  const jobOne = await jobs.findOneAndUpdate(
    { job_id: 'TEST-JOB-001' },
    {
      $set: {
        job_id: 'TEST-JOB-001',
        job_subject: 'Test MERN Stack Developer',
        job_details: '<p>Build and maintain sample test applications.</p>',
        sub_description: 'Test job for QA workflows',
        job_type: 'full-time',
        time_zone: 'IST',
        salary_currency: 'INR',
        salary_frequency: 'yearly',
        min_experience: 1,
        work_preference: 'hybrid',
        required_skills: ['MERN Stack', 'Node.js', 'React.js'],
        application_deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        job_location: 'Ahmedabad',
        isActive: true,
        min_salary: 400000,
        max_salary: 900000,
        jobPaymentType: 'CTC',
        addedBy: clientUser._id,
        jobModule: 'client',
        emailedVendors: [vendorUser._id],
        isDeleted: false,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const jobTwo = await jobs.findOneAndUpdate(
    { job_id: 'TEST-JOB-002' },
    {
      $set: {
        job_id: 'TEST-JOB-002',
        job_subject: 'Test QA Engineer',
        job_details: '<p>Validate sample application flows.</p>',
        sub_description: 'Test QA job for application workflow',
        job_type: 'contract',
        time_zone: 'IST',
        salary_currency: 'INR',
        salary_frequency: 'monthly',
        min_experience: 0,
        work_preference: 'remote',
        required_skills: ['Manual Testing'],
        application_deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        job_location: 'Remote',
        isActive: true,
        min_salary: 30000,
        max_salary: 70000,
        jobPaymentType: 'CTC',
        addedBy: vendorUser._id,
        jobModule: 'vendor',
        isDeleted: false,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const applicantDocs = await Applicant.insertMany(
    [
      {
        name: { firstName: 'Aarav', lastName: 'Shah' },
        phone: { phoneNumber: '9100000001', whatsappNumber: '9100000002' },
        email: 'aarav.applicant@test.talentbox',
        gender: 'male',
        qualification: 'B.Tech',
        currentCity: 'Ahmedabad',
        state: 'Gujarat',
        country: 'India',
        appliedSkills: ['MERN Stack', 'Node.js', 'React.js'],
        totalExperience: 2,
        expectedPkg: 800000,
        noticePeriod: 30,
        workPreference: 'hybrid',
        status: applicantEnum.APPLIED,
        interviewStage: applicantEnum.FIRST_INTERVIEW_ROUND,
        currentCompanyDesignation: 'Software Engineer',
        appliedRole: 'MERN Stack Developer',
        addedBy: applicantEnum.MANUAL,
        createdBy: Enum.ADMIN,
        isActive: true,
        meta: { seed: seedTag },
      },
      {
        name: { firstName: 'Nisha', lastName: 'Patel' },
        phone: { phoneNumber: '9100000003', whatsappNumber: '9100000004' },
        email: 'nisha.applicant@test.talentbox',
        gender: 'female',
        qualification: 'MCA',
        currentCity: 'Surat',
        state: 'Gujarat',
        country: 'India',
        appliedSkills: ['Manual Testing'],
        totalExperience: 1,
        expectedPkg: 500000,
        noticePeriod: 15,
        workPreference: 'remote',
        status: applicantEnum.IN_PROGRESS,
        interviewStage: applicantEnum.TECHNICAL,
        currentCompanyDesignation: 'QA Engineer',
        appliedRole: 'QA Engineer',
        addedBy: applicantEnum.MANUAL,
        createdBy: Enum.HR,
        isActive: true,
        meta: { seed: seedTag },
      },
    ],
    { ordered: false }
  ).catch(async () =>
    Applicant.find({
      email: {
        $in: ['aarav.applicant@test.talentbox', 'nisha.applicant@test.talentbox'],
      },
    })
  );

  const applicants = applicantDocs.length
    ? applicantDocs
    : await Applicant.find({
        email: {
          $in: ['aarav.applicant@test.talentbox', 'nisha.applicant@test.talentbox'],
        },
      });

  await Promise.all(
    applicants.map((applicant, index) => {
      const selectedJob = index === 0 ? jobOne : jobTwo;
      return jobApplication.findOneAndUpdate(
        { email: applicant.email, job_id: selectedJob._id },
        {
          $set: {
            name: applicant.name,
            phone: applicant.phone,
            email: applicant.email,
            gender: applicant.gender,
            qualification: applicant.qualification,
            state: applicant.state,
            country: applicant.country,
            currentCity: applicant.currentCity,
            appliedSkills: applicant.appliedSkills,
            totalExperience: applicant.totalExperience,
            expectedPkg: applicant.expectedPkg,
            noticePeriod: applicant.noticePeriod,
            workPreference: applicant.workPreference,
            status: applicant.status,
            interviewStage: applicant.interviewStage,
            currentCompanyDesignation: applicant.currentCompanyDesignation,
            appliedRole: applicant.appliedRole,
            addedBy: applicantEnum.GUEST,
            isActive: true,
            user_id: hrUser._id,
            job_id: selectedJob._id,
            vendor_id: selectedJob._id.equals(jobTwo._id) ? vendorUser._id : null,
            client_id: selectedJob._id.equals(jobOne._id) ? clientUser._id : null,
            score: index === 0 ? 82 : 74,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    })
  );

  console.log('Test seed completed.');
  console.log(`Login password for sample users: ${seedPassword}`);
  console.log('Users: admin@test.talentbox, hr@test.talentbox, vendor@test.talentbox, client@test.talentbox');

  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error('Test seed failed:', error);
  await mongoose.disconnect();
  process.exit(1);
});
