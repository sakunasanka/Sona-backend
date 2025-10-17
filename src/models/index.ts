import User from "./User";
import Client from "./Client";
import Student from "./Student";
import Notification from "./Notification";
import Prescription from "./Prescription";

const models = { User, Client, Student, Notification, Prescription };

export const initializeAssociations = () => {
  Object.values(models).forEach((model: any) => {
    if (typeof model.associate === "function") {
      model.associate(models);
    }
  });
};

export default models;
