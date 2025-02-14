import nodemailer from 'nodemailer'
import applicant_email from '../models/applicantModel.js'
import dotenv from 'dotenv'
dotenv.config()


export const sendEmail = async(req,res)=>{
    try {
        const {email_to,email_bcc,subject,description} = req.body
        const transporter = nodemailer.createTransport({
            host:process.env.HOST,
            port:2525,
            auth:{
                user:process.env.USER,
                pass:process.env.PASS
            }
        })
        const mailOptions = {
          from: process.env.FROM,
          email_to,
          email_bcc,
          subject,
          text: description,
        };
  
      const storeEmail = await applicant_email.create({
        from: process.env.FROM,
        to,
        bcc,
        subject,
        description,
      });
  
       await transporter.sendMail(mailOptions);
        res.status(200).json({success:true,message:"mail sent",data:mailOptions})
    } catch (error) {
        console.log(error)
    }
    }