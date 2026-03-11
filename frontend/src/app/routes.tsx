import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import DashboardPage from '../pages/dashboard/DashboardPage';
import EquipmentListPage from '../pages/equipment/EquipmentListPage';
import EquipmentDetailsPage from '../pages/equipment/EquipmentDetailsPage';
import BorrowRequestPage from '../pages/requests/BorrowRequestPage';
import MyRequestsPage from '../pages/requests/MyRequestsPage';
import UserManagementPage from '../pages/admin/UserManagementPage';
import InventoryManagementPage from '../pages/admin/InventoryManagementPage';

const Routes = () => {
  return (
    <Router>
      <Switch>
        <Route path="/login" component={LoginPage} />
        <Route path="/register" component={RegisterPage} />
        <Route path="/dashboard" component={DashboardPage} />
        <Route path="/equipment" exact component={EquipmentListPage} />
        <Route path="/equipment/:id" component={EquipmentDetailsPage} />
        <Route path="/requests/borrow" component={BorrowRequestPage} />
        <Route path="/requests/my" component={MyRequestsPage} />
        <Route path="/admin/users" component={UserManagementPage} />
        <Route path="/admin/inventory" component={InventoryManagementPage} />
      </Switch>
    </Router>
  );
};

export default Routes;