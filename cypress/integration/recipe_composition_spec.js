describe("Hop Aging Calculator", () => {
  it("successfully loads", () => {
    cy.visit("/");
  });

  describe("end-of-boil based gravity", () => {
    it("is the default mode", () => {
      cy.visit("/");
      cy.contains("Intermediate Gravity: 1.044 SG");
      cy.get(".HopAdditionIBUField").type("25");
      cy.contains("Insufficient substitute hops!");
      cy.contains("New Row").click();
      cy.get(".SubstitutionWeightField").type("200");
      cy.contains("Required Amount: 122.3 gms");
      cy.contains("Age at Brew date: 1 days");
      cy.contains("Estimated IBU: 25.0");
    });

    it("when selected calculates expected values", () => {
      cy.visit("/");
      cy.get("#IBUCalculationMode").click();
      cy.get("#modeIBUFinal").click();
      cy.contains("Intermediate Gravity: 1.044 SG");
      cy.get(".HopAdditionIBUField").type("25");
      cy.contains("Insufficient substitute hops!");
      cy.contains("New Row").click();
      cy.get(".SubstitutionWeightField").type("200");
      cy.contains("Required Amount: 122.3 gms");
      cy.contains("Age at Brew date: 1 days");
      cy.contains("Estimated IBU: 25.0");
    });
  });

  describe("when intermediate gravity mode is selected", () => {
    it("calculates expected values", () => {
      cy.visit("/");
      cy.get("#IBUCalculationMode").click();
      cy.get("#modeIBUIntermediate").click();
      cy.contains("Intermediate Gravity: 1.044 SG");
      cy.get(".HopAdditionIBUField").type("25");
      cy.contains("Insufficient substitute hops!");
      cy.contains("New Row").click();
      cy.get(".SubstitutionWeightField").type("200");
      cy.contains("Required Amount: 111.9 gms");
      cy.contains("Age at Brew date: 1 days");
      cy.contains("Estimated IBU: 25.0");
    });
  });

  describe("more than one substitution", () => {
    it("calculates the correct values", () => {
      cy.visit("/");
      cy.contains("Intermediate Gravity: 1.044 SG");
      cy.get(".HopAdditionIBUField").type("25");
      cy.contains("Insufficient substitute hops!");
      cy.contains("New Row").click();
      cy.get(".SubstitutionWeightField").type("100");
      cy.contains("Required Amount: 100.0 gms");
      cy.contains("Age at Brew date: 1 days");
      cy.contains("Estimated IBU: 20.4");
      cy.contains("New Row").click();
      cy.get(".SubstitutionWeightField").eq(1).type("200");
      cy.contains("Required Amount: 22.3 gms");
      cy.contains("Estimated IBU: 4.6");
    });
  });

  describe("more than one hop addition", () => {
    it("calculates the correct values", () => {
      cy.visit("/");
      cy.contains("Intermediate Gravity: 1.044 SG");
      cy.get(".HopAdditionIBUField").type("25");
      cy.contains("Insufficient substitute hops!");
      cy.contains("New Row").click();
      cy.get(".SubstitutionWeightField").type("100");
      cy.contains("Required Amount: 100.0 gms");
      cy.contains("Age at Brew date: 1 days");
      cy.contains("Estimated IBU: 20.4");
      cy.contains("New Row").click();
      cy.get(".SubstitutionWeightField").eq(1).type("200");
      cy.contains("Required Amount: 22.3 gms");
      cy.contains("Estimated IBU: 4.6");
      cy.contains("New Hop Addition").click();
      cy.get(".HopAdditionIBUField").eq(1).type("30");
      cy.get("span:contains('New Row')").eq(1).click();
      cy.get(".SubstitutionWeightField").eq(2).type("300");
      cy.contains("Required Amount: 146.7 gms");
      cy.contains("Estimated IBU: 30");
    });
  });
});
