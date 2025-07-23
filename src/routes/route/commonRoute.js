import express from 'express';
import {
    viewCountry, viewState, viewCity, viewCountryById, addCountry, updateCountryById, deleteCountryById, deleteManyCountries,
    addState, updateStateById, deleteManyStates, deleteStateById, viewStateById, viewCityById, updateCityById, deleteCityById, deleteManyCities, addCity
} from '../../controller/commonController.js';
import { authorization, verifyRoles } from '../../helpers/userMiddleware.js';

const router = express.Router();

router.get('/country', authorization, verifyRoles(['admin', 'hr','vendor','guest','client']), viewCountry);
router.get('/viewCountryById/:id', authorization, verifyRoles(['admin', 'hr']), viewCountryById);
router.post('/addCountry', authorization, verifyRoles(['admin', 'hr']), addCountry);
router.put('/updateCountry/:countryId', authorization, verifyRoles(['admin']), updateCountryById);
router.delete('/deleteCountry/:id', authorization, verifyRoles(['admin']), deleteCountryById);
router.delete('/deleteManyCountry', authorization, verifyRoles(['admin']), deleteManyCountries);

router.get('/state', authorization, verifyRoles(['admin', 'hr','client','vendor']), viewState);
router.post('/addState', authorization, verifyRoles(['admin', 'hr']), addState);
router.put('/updateState/:stateId', authorization, verifyRoles(['admin']), updateStateById);
router.delete('/deleteState/:id', authorization, verifyRoles(['admin']), deleteStateById);
router.delete('/deleteManyState', authorization, verifyRoles(['admin']), deleteManyStates);
router.get('/viewStateById/:id', authorization, verifyRoles(['admin', 'hr']), viewStateById);

router.get('/city', authorization, verifyRoles(['admin', 'hr', 'client', 'vendor', 'guest']), viewCity);
router.post('/addCity', authorization, verifyRoles(['admin', 'hr']), addCity);
router.get("/viewCityById/:id", authorization, verifyRoles(['admin', 'hr']), viewCityById);
router.put("/updateCityById/:city_id", authorization, verifyRoles(['admin']), updateCityById);
router.delete("/deleteCityById/:id", authorization, verifyRoles(['admin']), deleteCityById);
router.delete("/deleteManyCities", authorization, verifyRoles(['admin']), deleteManyCities);

export default router;
