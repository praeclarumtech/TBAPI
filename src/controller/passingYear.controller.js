import {Message} from '../utils/constant/passingYearMessage.js'
import {createYear,getOneYear,updateYearById,deleteYearById} from '../services/passingYear.js'
import {pagination} from '../helpers/commonFunction/passingYearPagination.js'
import PassingYear from '../models/passingYear.js'

export const addYear = async (req, res) => {
    try {
         await createYear(req.body.year)
         res.status(201).json({
            success: true,
            message: Message.NEW_YEAR,
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: Message.INT_SE_ERR
        })
    }
}

export const getYears = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1 
        const limit = parseInt(req.query.limit) || 10 
        const findYears = await pagination({Schema:PassingYear,page,limit})

        // console.log(findYears)

        res.status(200).json({
            success: true,
            message: Message.SHOW_YEARS,
            data: findYears.getYears,
            pagination:{
                totalRecords:findYears.totalRecords,
                currentPage:page,
                // totalPages: Math.ceil(findYears.totalRecords / limit), // roundup
                totalPages:findYears.totalPages && limit > 0 ? Math.ceil(findYears.totalRecords / limit):0,
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

export const getYearById = async(req,res)=>{
    try {
        const yearId = req.params.id
        const yearDetail =  await getOneYear(yearId)
        return res.status(200).json({
            success: true,
            message: Message.YEAR_BY_ID,
            data: yearDetail
        })
    } catch (error) {
        res.status(404).json({
            success: false,
            message: Message.YEAR_NF
        })      
    }
}

export const updateYear = async (req, res) => {
    try {
        const updateYear = await updateYearById(req.params.id,req.body)
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

export const deleteYear = async (req, res) => {
    try {
        const deleteYear = await deleteYearById(
            req.params.id, {is_deleted: true},)
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
