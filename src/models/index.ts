import User from "./User";
import Client from "./Client";
import Student from "./Student";
import Review from "./Review";
import Notification from "./Notification";
import Prescription from "./Prescription";

const models = { User, Client, Student, Review, Notification, Prescription };

export const initializeAssociations = () => {
  Object.values(models).forEach((model: any) => {
    if (typeof model.associate === "function") {
      model.associate(models);
    }
  });
};

export default models;
