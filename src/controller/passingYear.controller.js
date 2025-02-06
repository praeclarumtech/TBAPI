const passingYear = require('../models/passingYear')
const Message = require('../utils/constant/passingYearMessage')

exports.addYear = async (req, res) => {
    try {
        const {year} = req.body
        const newYear = await passingYear.create({year})
        res.status(201).json({
            success: true,
            message: Message.NEW_YEAR,
            data: newYear
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: Message.INT_SE_ERR
        })
    }
}

exports.getYears = async (req, res) => {
    try {
        let page = parseInt(req.query.page) // current page
        let limit = parseInt(req.query.limit) // num of record per page

        let skip = (page -1) * limit
        const totalRecords = await passingYear.countDocuments() // count the document within database
        const getYears = await passingYear.find().skip(skip).limit(limit)
        res.status(200).json({
            success: true,
            message: Message.SHOW_YEARS,
            data: getYears,
            pagination:{
                totalRecords:totalRecords,
                currentPage:page, // current page number
                totalPages:Math.ceil(totalRecords / 100), // roundup
                limit:limit //num of record per page
            }
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            message: Message.YEAR_NF,
        });
    }
};

exports.getYearById = async(req,res)=>{
    try {
        const yearId = req.params.id
        const getYearById = await passingYear.findById(yearId)
        
        return res.status(200).json({
            success: true,
            message: Message.YEAR_BY_ID,
            data: getYearById
        })
    } catch (error) {
        res.status(404).json({
            success: false,
            message: Message.YEAR_NF
        })      
    }
}

exports.updateYear = async (req, res) => {
    try {
        const updateYear = await passingYear.findByIdAndUpdate(
            req.params.id,
            req.body, {
            new: true
        }
        )
        res.status(202).json({
            success: true,
            message: Message.YEAR_UP,
            data: updateYear
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: Message.INV_CR
        })
    }
}

exports.deleteYear = async (req, res) => {
    try {
        const yearId = req.params.id
        const deleteYear = await passingYear.findByIdAndUpdate(
            yearId,
            {is_deleted: true},
        )
        if (!deleteYear) {
            return res.status(404).json({
                success: false,
                message: Message.DATA_NF
            })
        }
        res.status(200).json({
            success: true,
            message:Message.YEAR_DEL,
            data: deleteYear
        })
    } catch (error) {
        res.status(505).json({
            success: false,
            message: Message.INV_CR
        })
    }
}
