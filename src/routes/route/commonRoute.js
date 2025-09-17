import express from 'express';
import {
    viewCountry, viewState, viewCity, viewCountryById, addCountry, updateCountryById, deleteCountryById, deleteManyCountries,
    addState, updateStateById, deleteManyStates, deleteStateById, viewStateById, viewCityById, updateCityById, deleteCityById, deleteManyCities, addCity
} from '../../controller/commonController.js';
import { authorization, verifyRoles } from '../../helpers/userMiddleware.js';

const router = express.Router();

router.get('/country', viewCountry);
router.get('/viewCountryById/:id', viewCountryById);
router.post('/addCountry', addCountry);
router.put('/updateCountry/:countryId', updateCountryById);
router.delete('/deleteCountry/:id', deleteCountryById);
router.delete('/deleteManyCountry', deleteManyCountries);

router.get('/state', viewState);
router.post('/addState', addState);
router.put('/updateState/:stateId', updateStateById);
router.delete('/deleteState/:id', deleteStateById);
router.delete('/deleteManyState', deleteManyStates);
router.get('/viewStateById/:id', viewStateById);

router.get('/city', viewCity);
router.post('/addCity', addCity);
router.get('/viewCityById/:id', viewCityById);
router.put('/updateCityById/:city_id', updateCityById);
router.delete('/deleteCityById/:id', deleteCityById);
router.delete('/deleteManyCities', deleteManyCities);

export default router;
