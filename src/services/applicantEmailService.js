import applicantEmail from "../models/applicantEmailModel.js";

export const findAllEmails = async()=>{
  return  await applicantEmail.find()
}
export const deleteSingleEMail = async(mailId)=>{
    return await applicantEmail.findByIdAndDelete(mailId)
}

export const removeManyEmails = async(ids)=>{
    return await applicantEmail.deleteMany({_id: { $in: ids}})
}

export const createEmail = async({ email_to, email_bcc, subject, description, date })=>{
  return await applicantEmail.create({
    email_to,
    email_bcc,
    subject,
    text:description,
    date,
  })
}