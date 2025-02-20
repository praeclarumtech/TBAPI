import { use, expect } from "chai";
import chaiHttp from "chai-http";
import app from "../../server.js";

const chai = use(chaiHttp);
const { expect } = chai;

describe("GET /api/year/listOfYears", () => {
    it("should retrieve the list of years", async () => {
        const res = await chai.request(app).get("/api/year/listOfYears");
        console.log("res==--->>>", res.body);

        expect(res).to.have.status(200);
        expect(res.body).to.have.property("success", true);
        expect(res.body).to.have.property("data").that.is.an("array");
    });

    it("should return an error for an invalid route", async () => {
        const res = await chai.request(app).get("/api/year/invalidRoute");
        console.log("22222222res==--->>>", res.body);

        expect(res).to.have.status(404);
        expect(res.body).to.have.property("success", false);
        expect(res.body).to.have.property("message").that.is.a("string");
    });
});
