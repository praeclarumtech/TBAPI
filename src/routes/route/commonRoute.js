import express from 'express';
import { viewCountry,viewState,viewCity,viewCountryById,addCountry,updateCountryById,deleteCountryById,deleteManyCountries,
    addState,updateStateById,deleteManyStates,deleteStateById, viewStateById, viewCityById, updateCityById, deleteCityById, deleteManyCities, addCity
} from '../../controller/commonController.js';
import { authorization } from '../../helpers/userMiddleware.js';

const router = express.Router();

router.get('/country', viewCountry);
router.get('/viewCountryById/:id', authorization, viewCountryById);
router.post('/addCountry', authorization, addCountry);
router.put('/updateCountry/:countryId', authorization, updateCountryById);
router.delete('/deleteCountry/:id', authorization, deleteCountryById);
router.delete('/deleteManyCountry', authorization, deleteManyCountries);

router.get('/state', viewState);
router.post('/addState', authorization, addState);
router.put('/updateState/:stateId', authorization, updateStateById);
router.delete('/deleteState/:id', authorization, deleteStateById);
router.delete('/deleteManyState', authorization, deleteManyStates);
router.get('/viewStateById/:id', authorization, viewStateById);

router.get('/city', viewCity);
router.post('/addCity', authorization, addCity);
router.get("/viewCityById/:id", viewCityById);
router.put("/updateCityById/:city_id", updateCityById);
router.delete("/deleteCityById/:id", deleteCityById);
router.delete("/deleteManyCities", deleteManyCities);

export default router;
