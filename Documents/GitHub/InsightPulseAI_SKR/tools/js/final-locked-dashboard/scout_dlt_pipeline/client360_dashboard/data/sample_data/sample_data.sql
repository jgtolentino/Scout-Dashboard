DELETE FROM dbo.Stores;
GO

SET IDENTITY_INSERT dbo.Stores ON;
GO

INSERT INTO dbo.Stores (StoreID, StoreName, Location, Size, GeoLatitude, GeoLongitude, ManagerName, ManagerContactInfo, DeviceName, DeviceID) VALUES (
      1, 
      N'Village Shop #1', 
      N'Navotas', 
      N'Extra Large', 
      14.605357, 
      121.024033, 
      N'Manager 1', 
      N'manager1@example.com', 
      N'Store Device 1', 
      N'DEVICE-1006');
INSERT INTO dbo.Stores (StoreID, StoreName, Location, Size, GeoLatitude, GeoLongitude, ManagerName, ManagerContactInfo, DeviceName, DeviceID) VALUES (
      2, 
      N'Fresh Market #2', 
      N'Pasay', 
      N'Extra Large', 
      14.77385, 
      120.937764, 
      N'Manager 2', 
      N'manager2@example.com', 
      N'Store Device 2', 
      N'DEVICE-1009');
INSERT INTO dbo.Stores (StoreID, StoreName, Location, Size, GeoLatitude, GeoLongitude, ManagerName, ManagerContactInfo, DeviceName, DeviceID) VALUES (
      3, 
      N'Quick Shop #3', 
      N'Pasig', 
      N'Large', 
      14.554862, 
      121.030249, 
      N'Manager 3', 
      N'manager3@example.com', 
      N'Store Device 3', 
      N'DEVICE-1006');
INSERT INTO dbo.Stores (StoreID, StoreName, Location, Size, GeoLatitude, GeoLongitude, ManagerName, ManagerContactInfo, DeviceName, DeviceID) VALUES (
      4, 
      N'Local Grocer #4', 
      N'Valenzuela', 
      N'Large', 
      14.54262, 
      121.007193, 
      N'Manager 4', 
      N'manager4@example.com', 
      N'Store Device 4', 
      N'DEVICE-1007');
INSERT INTO dbo.Stores (StoreID, StoreName, Location, Size, GeoLatitude, GeoLongitude, ManagerName, ManagerContactInfo, DeviceName, DeviceID) VALUES (
      5, 
      N'Village Shop #5', 
      N'Mandaluyong', 
      N'Medium', 
      14.489901, 
      120.95843, 
      N'Manager 5', 
      N'manager5@example.com', 
      N'Store Device 5', 
      N'DEVICE-1007');
INSERT INTO dbo.Stores (StoreID, StoreName, Location, Size, GeoLatitude, GeoLongitude, ManagerName, ManagerContactInfo, DeviceName, DeviceID) VALUES (
      6, 
      N'Super Saver #6', 
      N'Valenzuela', 
      N'Large', 
      14.550516, 
      121.071955, 
      N'Manager 6', 
      N'manager6@example.com', 
      N'Store Device 6', 
      N'DEVICE-1006');
INSERT INTO dbo.Stores (StoreID, StoreName, Location, Size, GeoLatitude, GeoLongitude, ManagerName, ManagerContactInfo, DeviceName, DeviceID) VALUES (
      7, 
      N'Village Shop #7', 
      N'Davao', 
      N'Extra Large', 
      14.735826, 
      121.081223, 
      N'Manager 7', 
      N'manager7@example.com', 
      N'Store Device 7', 
      N'DEVICE-1002');
INSERT INTO dbo.Stores (StoreID, StoreName, Location, Size, GeoLatitude, GeoLongitude, ManagerName, ManagerContactInfo, DeviceName, DeviceID) VALUES (
      8, 
      N'Downtown Market #8', 
      N'Pasay', 
      N'Extra Large', 
      14.493751, 
      121.074626, 
      N'Manager 8', 
      N'manager8@example.com', 
      N'Store Device 8', 
      N'DEVICE-1004');
INSERT INTO dbo.Stores (StoreID, StoreName, Location, Size, GeoLatitude, GeoLongitude, ManagerName, ManagerContactInfo, DeviceName, DeviceID) VALUES (
      9, 
      N'Super Saver #9', 
      N'Muntinlupa', 
      N'Medium', 
      14.795809, 
      120.96799, 
      N'Manager 9', 
      N'manager9@example.com', 
      N'Store Device 9', 
      N'DEVICE-1005');
INSERT INTO dbo.Stores (StoreID, StoreName, Location, Size, GeoLatitude, GeoLongitude, ManagerName, ManagerContactInfo, DeviceName, DeviceID) VALUES (
      10, 
      N'Village Shop #10', 
      N'Makati', 
      N'Large', 
      14.787747, 
      121.082127, 
      N'Manager 10', 
      N'manager10@example.com', 
      N'Store Device 10', 
      N'DEVICE-1001');
INSERT INTO dbo.Stores (StoreID, StoreName, Location, Size, GeoLatitude, GeoLongitude, ManagerName, ManagerContactInfo, DeviceName, DeviceID) VALUES (
      11, 
      N'Super Saver #11', 
      N'Navotas', 
      N'Extra Large', 
      14.726897, 
      121.060785, 
      N'Manager 11', 
      N'manager11@example.com', 
      N'Store Device 11', 
      N'DEVICE-1004');
INSERT INTO dbo.Stores (StoreID, StoreName, Location, Size, GeoLatitude, GeoLongitude, ManagerName, ManagerContactInfo, DeviceName, DeviceID) VALUES (
      12, 
      N'Daily Needs #12', 
      N'Navotas', 
      N'Medium', 
      14.41249, 
      121.033094, 
      N'Manager 12', 
      N'manager12@example.com', 
      N'Store Device 12', 
      N'DEVICE-1002');
INSERT INTO dbo.Stores (StoreID, StoreName, Location, Size, GeoLatitude, GeoLongitude, ManagerName, ManagerContactInfo, DeviceName, DeviceID) VALUES (
      13, 
      N'Main Street Market #13', 
      N'Valenzuela', 
      N'Medium', 
      14.796005, 
      121.010175, 
      N'Manager 13', 
      N'manager13@example.com', 
      N'Store Device 13', 
      N'DEVICE-1004');
INSERT INTO dbo.Stores (StoreID, StoreName, Location, Size, GeoLatitude, GeoLongitude, ManagerName, ManagerContactInfo, DeviceName, DeviceID) VALUES (
      14, 
      N'Local Grocer #14', 
      N'Paranaque', 
      N'Extra Large', 
      14.611268, 
      120.974087, 
      N'Manager 14', 
      N'manager14@example.com', 
      N'Store Device 14', 
      N'DEVICE-1009');
INSERT INTO dbo.Stores (StoreID, StoreName, Location, Size, GeoLatitude, GeoLongitude, ManagerName, ManagerContactInfo, DeviceName, DeviceID) VALUES (
      15, 
      N'Corner Store #15', 
      N'Pasay', 
      N'Large', 
      14.553785, 
      121.039985, 
      N'Manager 15', 
      N'manager15@example.com', 
      N'Store Device 15', 
      N'DEVICE-1002');

SET IDENTITY_INSERT dbo.Stores OFF;
GO

DELETE FROM dbo.Brands;
GO

SET IDENTITY_INSERT dbo.Brands ON;
GO

INSERT INTO dbo.Brands (BrandID, BrandName, Category, Variations, IsMonitored) VALUES (
      1, 
      N'Mega Brand', 
      N'Food', 
      N'["Mega Brand Original","Mega Brand Extra"]', 
      1);
INSERT INTO dbo.Brands (BrandID, BrandName, Category, Variations, IsMonitored) VALUES (
      2, 
      N'Super Clean', 
      N'Pet Care', 
      N'["Super Clean Original","Super Clean Extra"]', 
      1);
INSERT INTO dbo.Brands (BrandID, BrandName, Category, Variations, IsMonitored) VALUES (
      3, 
      N'Quick Snack', 
      N'Personal Care', 
      N'["Quick Snack Original","Quick Snack Extra"]', 
      1);
INSERT INTO dbo.Brands (BrandID, BrandName, Category, Variations, IsMonitored) VALUES (
      4, 
      N'Fresh Foods', 
      N'Baking', 
      N'["Fresh Foods Original","Fresh Foods Extra"]', 
      0);
INSERT INTO dbo.Brands (BrandID, BrandName, Category, Variations, IsMonitored) VALUES (
      5, 
      N'Sparkle', 
      N'Pet Care', 
      N'["Sparkle Original","Sparkle Extra"]', 
      1);
INSERT INTO dbo.Brands (BrandID, BrandName, Category, Variations, IsMonitored) VALUES (
      6, 
      N'Golden Foods', 
      N'Frozen', 
      N'["Golden Foods Original","Golden Foods Extra"]', 
      1);
INSERT INTO dbo.Brands (BrandID, BrandName, Category, Variations, IsMonitored) VALUES (
      7, 
      N'Tasty Treats', 
      N'Paper Products', 
      N'["Tasty Treats Original","Tasty Treats Extra"]', 
      1);
INSERT INTO dbo.Brands (BrandID, BrandName, Category, Variations, IsMonitored) VALUES (
      8, 
      N'Natural Choice', 
      N'Household', 
      N'["Natural Choice Original","Natural Choice Extra"]', 
      1);
INSERT INTO dbo.Brands (BrandID, BrandName, Category, Variations, IsMonitored) VALUES (
      9, 
      N'Pure Products', 
      N'Dairy', 
      N'["Pure Products Original","Pure Products Extra"]', 
      1);
INSERT INTO dbo.Brands (BrandID, BrandName, Category, Variations, IsMonitored) VALUES (
      10, 
      N'Royal Goods', 
      N'Personal Care', 
      N'["Royal Goods Original","Royal Goods Extra"]', 
      0);
INSERT INTO dbo.Brands (BrandID, BrandName, Category, Variations, IsMonitored) VALUES (
      11, 
      N'Ultra Care', 
      N'Pet Care', 
      N'["Ultra Care Original","Ultra Care Extra"]', 
      1);
INSERT INTO dbo.Brands (BrandID, BrandName, Category, Variations, IsMonitored) VALUES (
      12, 
      N'Premium Select', 
      N'Health', 
      N'["Premium Select Original","Premium Select Extra"]', 
      1);
INSERT INTO dbo.Brands (BrandID, BrandName, Category, Variations, IsMonitored) VALUES (
      13, 
      N'Sunshine', 
      N'Baby Care', 
      N'["Sunshine Original","Sunshine Extra"]', 
      1);
INSERT INTO dbo.Brands (BrandID, BrandName, Category, Variations, IsMonitored) VALUES (
      14, 
      N'Silver Line', 
      N'Personal Care', 
      N'["Silver Line Original","Silver Line Extra"]', 
      0);
INSERT INTO dbo.Brands (BrandID, BrandName, Category, Variations, IsMonitored) VALUES (
      15, 
      N'Morning Fresh', 
      N'Health', 
      N'["Morning Fresh Original","Morning Fresh Extra"]', 
      1);
INSERT INTO dbo.Brands (BrandID, BrandName, Category, Variations, IsMonitored) VALUES (
      16, 
      N'Tropical Delight', 
      N'Health', 
      N'["Tropical Delight Original","Tropical Delight Extra"]', 
      1);
INSERT INTO dbo.Brands (BrandID, BrandName, Category, Variations, IsMonitored) VALUES (
      17, 
      N'Family Choice', 
      N'Pet Care', 
      N'["Family Choice Original","Family Choice Extra"]', 
      1);
INSERT INTO dbo.Brands (BrandID, BrandName, Category, Variations, IsMonitored) VALUES (
      18, 
      N'Value Pack', 
      N'Household', 
      N'["Value Pack Original","Value Pack Extra"]', 
      0);
INSERT INTO dbo.Brands (BrandID, BrandName, Category, Variations, IsMonitored) VALUES (
      19, 
      N'Island Breeze', 
      N'Baby Care', 
      N'["Island Breeze Original","Island Breeze Extra"]', 
      1);
INSERT INTO dbo.Brands (BrandID, BrandName, Category, Variations, IsMonitored) VALUES (
      20, 
      N'Daily Essentials', 
      N'Food', 
      N'["Daily Essentials Original","Daily Essentials Extra"]', 
      1);

SET IDENTITY_INSERT dbo.Brands OFF;
GO

DELETE FROM dbo.Products;
GO

SET IDENTITY_INSERT dbo.Products ON;
GO

INSERT INTO dbo.Products (ProductID, ProductName, Category, Aliases, BrandID) VALUES (
      1, 
      N'Dish Soap', 
      N'Food', 
      N'["Dish Soap Alt","Dish Soap 2"]', 
      16);
INSERT INTO dbo.Products (ProductID, ProductName, Category, Aliases, BrandID) VALUES (
      2, 
      N'Laundry Detergent', 
      N'Canned Goods', 
      N'["Laundry Detergent Alt","Laundry Detergent 2"]', 
      14);
INSERT INTO dbo.Products (ProductID, ProductName, Category, Aliases, BrandID) VALUES (
      3, 
      N'Shampoo', 
      N'Health', 
      N'["Shampoo Alt","Shampoo 2"]', 
      14);
INSERT INTO dbo.Products (ProductID, ProductName, Category, Aliases, BrandID) VALUES (
      4, 
      N'Toothpaste', 
      N'Dairy', 
      N'["Toothpaste Alt","Toothpaste 2"]', 
      15);
INSERT INTO dbo.Products (ProductID, ProductName, Category, Aliases, BrandID) VALUES (
      5, 
      N'Coffee', 
      N'Personal Care', 
      N'["Coffee Alt","Coffee 2"]', 
      1);
INSERT INTO dbo.Products (ProductID, ProductName, Category, Aliases, BrandID) VALUES (
      6, 
      N'Tea', 
      N'Snacks', 
      N'["Tea Alt","Tea 2"]', 
      7);
INSERT INTO dbo.Products (ProductID, ProductName, Category, Aliases, BrandID) VALUES (
      7, 
      N'Cookies', 
      N'Snacks', 
      N'["Cookies Alt","Cookies 2"]', 
      3);
INSERT INTO dbo.Products (ProductID, ProductName, Category, Aliases, BrandID) VALUES (
      8, 
      N'Crackers', 
      N'Household', 
      N'["Crackers Alt","Crackers 2"]', 
      8);
INSERT INTO dbo.Products (ProductID, ProductName, Category, Aliases, BrandID) VALUES (
      9, 
      N'Milk', 
      N'Cleaning', 
      N'["Milk Alt","Milk 2"]', 
      2);
INSERT INTO dbo.Products (ProductID, ProductName, Category, Aliases, BrandID) VALUES (
      10, 
      N'Bread', 
      N'Beverage', 
      N'["Bread Alt","Bread 2"]', 
      7);
INSERT INTO dbo.Products (ProductID, ProductName, Category, Aliases, BrandID) VALUES (
      11, 
      N'Cereal', 
      N'Food', 
      N'["Cereal Alt","Cereal 2"]', 
      18);
INSERT INTO dbo.Products (ProductID, ProductName, Category, Aliases, BrandID) VALUES (
      12, 
      N'Rice', 
      N'Food', 
      N'["Rice Alt","Rice 2"]', 
      6);
INSERT INTO dbo.Products (ProductID, ProductName, Category, Aliases, BrandID) VALUES (
      13, 
      N'Pasta', 
      N'Beauty', 
      N'["Pasta Alt","Pasta 2"]', 
      18);
INSERT INTO dbo.Products (ProductID, ProductName, Category, Aliases, BrandID) VALUES (
      14, 
      N'Canned Tuna', 
      N'Canned Goods', 
      N'["Canned Tuna Alt","Canned Tuna 2"]', 
      9);
INSERT INTO dbo.Products (ProductID, ProductName, Category, Aliases, BrandID) VALUES (
      15, 
      N'Canned Beans', 
      N'Household', 
      N'["Canned Beans Alt","Canned Beans 2"]', 
      7);
INSERT INTO dbo.Products (ProductID, ProductName, Category, Aliases, BrandID) VALUES (
      16, 
      N'Soap', 
      N'Frozen', 
      N'["Soap Alt","Soap 2"]', 
      11);
INSERT INTO dbo.Products (ProductID, ProductName, Category, Aliases, BrandID) VALUES (
      17, 
      N'Body Wash', 
      N'Food', 
      N'["Body Wash Alt","Body Wash 2"]', 
      13);
INSERT INTO dbo.Products (ProductID, ProductName, Category, Aliases, BrandID) VALUES (
      18, 
      N'Toilet Paper', 
      N'Frozen', 
      N'["Toilet Paper Alt","Toilet Paper 2"]', 
      20);
INSERT INTO dbo.Products (ProductID, ProductName, Category, Aliases, BrandID) VALUES (
      19, 
      N'Paper Towels', 
      N'Beverage', 
      N'["Paper Towels Alt","Paper Towels 2"]', 
      20);
INSERT INTO dbo.Products (ProductID, ProductName, Category, Aliases, BrandID) VALUES (
      20, 
      N'Facial Tissue', 
      N'Personal Care', 
      N'["Facial Tissue Alt","Facial Tissue 2"]', 
      4);
INSERT INTO dbo.Products (ProductID, ProductName, Category, Aliases, BrandID) VALUES (
      21, 
      N'Baby Wipes', 
      N'Cleaning', 
      N'["Baby Wipes Alt","Baby Wipes 2"]', 
      5);
INSERT INTO dbo.Products (ProductID, ProductName, Category, Aliases, BrandID) VALUES (
      22, 
      N'Diapers', 
      N'Baking', 
      N'["Diapers Alt","Diapers 2"]', 
      3);
INSERT INTO dbo.Products (ProductID, ProductName, Category, Aliases, BrandID) VALUES (
      23, 
      N'Dog Food', 
      N'Canned Goods', 
      N'["Dog Food Alt","Dog Food 2"]', 
      10);
INSERT INTO dbo.Products (ProductID, ProductName, Category, Aliases, BrandID) VALUES (
      24, 
      N'Cat Food', 
      N'Dairy', 
      N'["Cat Food Alt","Cat Food 2"]', 
      17);
INSERT INTO dbo.Products (ProductID, ProductName, Category, Aliases, BrandID) VALUES (
      25, 
      N'Soft Drink', 
      N'Personal Care', 
      N'["Soft Drink Alt","Soft Drink 2"]', 
      2);
INSERT INTO dbo.Products (ProductID, ProductName, Category, Aliases, BrandID) VALUES (
      26, 
      N'Juice', 
      N'Health', 
      N'["Juice Alt","Juice 2"]', 
      19);
INSERT INTO dbo.Products (ProductID, ProductName, Category, Aliases, BrandID) VALUES (
      27, 
      N'Water', 
      N'Snacks', 
      N'["Water Alt","Water 2"]', 
      13);
INSERT INTO dbo.Products (ProductID, ProductName, Category, Aliases, BrandID) VALUES (
      28, 
      N'Chips', 
      N'Snacks', 
      N'["Chips Alt","Chips 2"]', 
      2);
INSERT INTO dbo.Products (ProductID, ProductName, Category, Aliases, BrandID) VALUES (
      29, 
      N'Candy', 
      N'Personal Care', 
      N'["Candy Alt","Candy 2"]', 
      12);
INSERT INTO dbo.Products (ProductID, ProductName, Category, Aliases, BrandID) VALUES (
      30, 
      N'Chocolate', 
      N'Dairy', 
      N'["Chocolate Alt","Chocolate 2"]', 
      4);
INSERT INTO dbo.Products (ProductID, ProductName, Category, Aliases, BrandID) VALUES (
      31, 
      N'Ice Cream', 
      N'Paper Products', 
      N'["Ice Cream Alt","Ice Cream 2"]', 
      11);
INSERT INTO dbo.Products (ProductID, ProductName, Category, Aliases, BrandID) VALUES (
      32, 
      N'Yogurt', 
      N'Baby Care', 
      N'["Yogurt Alt","Yogurt 2"]', 
      20);
INSERT INTO dbo.Products (ProductID, ProductName, Category, Aliases, BrandID) VALUES (
      33, 
      N'Cheese', 
      N'Beverage', 
      N'["Cheese Alt","Cheese 2"]', 
      19);
INSERT INTO dbo.Products (ProductID, ProductName, Category, Aliases, BrandID) VALUES (
      34, 
      N'Butter', 
      N'Household', 
      N'["Butter Alt","Butter 2"]', 
      7);
INSERT INTO dbo.Products (ProductID, ProductName, Category, Aliases, BrandID) VALUES (
      35, 
      N'Eggs', 
      N'Beverage', 
      N'["Eggs Alt","Eggs 2"]', 
      18);
INSERT INTO dbo.Products (ProductID, ProductName, Category, Aliases, BrandID) VALUES (
      36, 
      N'Frozen Pizza', 
      N'Health', 
      N'["Frozen Pizza Alt","Frozen Pizza 2"]', 
      15);
INSERT INTO dbo.Products (ProductID, ProductName, Category, Aliases, BrandID) VALUES (
      37, 
      N'Frozen Vegetables', 
      N'Personal Care', 
      N'["Frozen Vegetables Alt","Frozen Vegetables 2"]', 
      14);
INSERT INTO dbo.Products (ProductID, ProductName, Category, Aliases, BrandID) VALUES (
      38, 
      N'Flour', 
      N'Personal Care', 
      N'["Flour Alt","Flour 2"]', 
      12);
INSERT INTO dbo.Products (ProductID, ProductName, Category, Aliases, BrandID) VALUES (
      39, 
      N'Sugar', 
      N'Baking', 
      N'["Sugar Alt","Sugar 2"]', 
      19);
INSERT INTO dbo.Products (ProductID, ProductName, Category, Aliases, BrandID) VALUES (
      40, 
      N'Salt', 
      N'Dairy', 
      N'["Salt Alt","Salt 2"]', 
      16);
INSERT INTO dbo.Products (ProductID, ProductName, Category, Aliases, BrandID) VALUES (
      41, 
      N'Pepper', 
      N'Beauty', 
      N'["Pepper Alt","Pepper 2"]', 
      3);
INSERT INTO dbo.Products (ProductID, ProductName, Category, Aliases, BrandID) VALUES (
      42, 
      N'Cooking Oil', 
      N'Cleaning', 
      N'["Cooking Oil Alt","Cooking Oil 2"]', 
      9);
INSERT INTO dbo.Products (ProductID, ProductName, Category, Aliases, BrandID) VALUES (
      43, 
      N'Vinegar', 
      N'Beverage', 
      N'["Vinegar Alt","Vinegar 2"]', 
      15);
INSERT INTO dbo.Products (ProductID, ProductName, Category, Aliases, BrandID) VALUES (
      44, 
      N'Soy Sauce', 
      N'Personal Care', 
      N'["Soy Sauce Alt","Soy Sauce 2"]', 
      15);
INSERT INTO dbo.Products (ProductID, ProductName, Category, Aliases, BrandID) VALUES (
      45, 
      N'Ketchup', 
      N'Dairy', 
      N'["Ketchup Alt","Ketchup 2"]', 
      20);
INSERT INTO dbo.Products (ProductID, ProductName, Category, Aliases, BrandID) VALUES (
      46, 
      N'Mustard', 
      N'Personal Care', 
      N'["Mustard Alt","Mustard 2"]', 
      14);
INSERT INTO dbo.Products (ProductID, ProductName, Category, Aliases, BrandID) VALUES (
      47, 
      N'Mayonnaise', 
      N'Beverage', 
      N'["Mayonnaise Alt","Mayonnaise 2"]', 
      18);
INSERT INTO dbo.Products (ProductID, ProductName, Category, Aliases, BrandID) VALUES (
      48, 
      N'Jam', 
      N'Household', 
      N'["Jam Alt","Jam 2"]', 
      20);
INSERT INTO dbo.Products (ProductID, ProductName, Category, Aliases, BrandID) VALUES (
      49, 
      N'Peanut Butter', 
      N'Personal Care', 
      N'["Peanut Butter Alt","Peanut Butter 2"]', 
      20);
INSERT INTO dbo.Products (ProductID, ProductName, Category, Aliases, BrandID) VALUES (
      50, 
      N'Honey', 
      N'Frozen', 
      N'["Honey Alt","Honey 2"]', 
      2);

SET IDENTITY_INSERT dbo.Products OFF;
GO

DELETE FROM dbo.Customers;
GO

INSERT INTO dbo.Customers (FacialID, Age, Gender, Emotion, LastUpdateDate) VALUES (
      N'FACE-1001', 
      70, 
      N'Female', 
      N'Surprised', 
      '2025-02-11 16:00:16');
INSERT INTO dbo.Customers (FacialID, Age, Gender, Emotion, LastUpdateDate) VALUES (
      N'FACE-1002', 
      18, 
      N'Unknown', 
      N'Thoughtful', 
      '2025-02-19 15:36:40');
INSERT INTO dbo.Customers (FacialID, Age, Gender, Emotion, LastUpdateDate) VALUES (
      N'FACE-1003', 
      61, 
      N'Other', 
      N'Thoughtful', 
      '2025-04-05 17:57:31');
INSERT INTO dbo.Customers (FacialID, Age, Gender, Emotion, LastUpdateDate) VALUES (
      N'FACE-1004', 
      41, 
      N'Female', 
      N'Thoughtful', 
      '2025-04-22 15:50:40');
INSERT INTO dbo.Customers (FacialID, Age, Gender, Emotion, LastUpdateDate) VALUES (
      N'FACE-1005', 
      56, 
      N'Unknown', 
      N'Thoughtful', 
      '2025-02-23 16:28:21');
INSERT INTO dbo.Customers (FacialID, Age, Gender, Emotion, LastUpdateDate) VALUES (
      N'FACE-1006', 
      36, 
      N'Male', 
      N'Interested', 
      '2025-05-10 14:51:39');
INSERT INTO dbo.Customers (FacialID, Age, Gender, Emotion, LastUpdateDate) VALUES (
      N'FACE-1007', 
      22, 
      N'Unknown', 
      N'Satisfied', 
      '2025-05-11 14:58:00');
INSERT INTO dbo.Customers (FacialID, Age, Gender, Emotion, LastUpdateDate) VALUES (
      N'FACE-1008', 
      31, 
      N'Female', 
      N'Surprised', 
      '2025-04-02 14:21:13');
INSERT INTO dbo.Customers (FacialID, Age, Gender, Emotion, LastUpdateDate) VALUES (
      N'FACE-1009', 
      73, 
      N'Female', 
      N'Surprised', 
      '2025-04-10 16:55:10');
INSERT INTO dbo.Customers (FacialID, Age, Gender, Emotion, LastUpdateDate) VALUES (
      N'FACE-1010', 
      61, 
      N'Female', 
      N'Surprised', 
      '2025-02-17 15:58:38');
INSERT INTO dbo.Customers (FacialID, Age, Gender, Emotion, LastUpdateDate) VALUES (
      N'FACE-1011', 
      61, 
      N'Male', 
      N'Concerned', 
      '2025-04-24 05:25:20');
INSERT INTO dbo.Customers (FacialID, Age, Gender, Emotion, LastUpdateDate) VALUES (
      N'FACE-1012', 
      67, 
      N'Male', 
      N'Surprised', 
      '2025-04-29 16:23:25');
INSERT INTO dbo.Customers (FacialID, Age, Gender, Emotion, LastUpdateDate) VALUES (
      N'FACE-1013', 
      24, 
      N'Male', 
      N'Satisfied', 
      '2025-05-17 09:21:10');
INSERT INTO dbo.Customers (FacialID, Age, Gender, Emotion, LastUpdateDate) VALUES (
      N'FACE-1014', 
      59, 
      N'Unknown', 
      N'Neutral', 
      '2025-03-31 17:41:24');
INSERT INTO dbo.Customers (FacialID, Age, Gender, Emotion, LastUpdateDate) VALUES (
      N'FACE-1015', 
      40, 
      N'Female', 
      N'Neutral', 
      '2025-03-13 19:27:35');
INSERT INTO dbo.Customers (FacialID, Age, Gender, Emotion, LastUpdateDate) VALUES (
      N'FACE-1016', 
      61, 
      N'Other', 
      N'Thoughtful', 
      '2025-03-02 03:15:00');
INSERT INTO dbo.Customers (FacialID, Age, Gender, Emotion, LastUpdateDate) VALUES (
      N'FACE-1017', 
      25, 
      N'Other', 
      N'Interested', 
      '2025-05-14 19:39:34');
INSERT INTO dbo.Customers (FacialID, Age, Gender, Emotion, LastUpdateDate) VALUES (
      N'FACE-1018', 
      63, 
      N'Female', 
      N'Surprised', 
      '2025-04-21 17:25:03');
INSERT INTO dbo.Customers (FacialID, Age, Gender, Emotion, LastUpdateDate) VALUES (
      N'FACE-1019', 
      55, 
      N'Other', 
      N'Satisfied', 
      '2025-03-07 05:53:43');
INSERT INTO dbo.Customers (FacialID, Age, Gender, Emotion, LastUpdateDate) VALUES (
      N'FACE-1020', 
      31, 
      N'Male', 
      N'Surprised', 
      '2025-03-07 03:16:32');
INSERT INTO dbo.Customers (FacialID, Age, Gender, Emotion, LastUpdateDate) VALUES (
      N'FACE-1021', 
      54, 
      N'Male', 
      N'Neutral', 
      '2025-02-20 02:12:37');
INSERT INTO dbo.Customers (FacialID, Age, Gender, Emotion, LastUpdateDate) VALUES (
      N'FACE-1022', 
      37, 
      N'Unknown', 
      N'Neutral', 
      '2025-01-15 18:46:36');
INSERT INTO dbo.Customers (FacialID, Age, Gender, Emotion, LastUpdateDate) VALUES (
      N'FACE-1023', 
      24, 
      N'Female', 
      N'Satisfied', 
      '2025-02-27 22:56:33');
INSERT INTO dbo.Customers (FacialID, Age, Gender, Emotion, LastUpdateDate) VALUES (
      N'FACE-1024', 
      19, 
      N'Male', 
      N'Satisfied', 
      '2025-02-20 18:34:51');
INSERT INTO dbo.Customers (FacialID, Age, Gender, Emotion, LastUpdateDate) VALUES (
      N'FACE-1025', 
      61, 
      N'Male', 
      N'Neutral', 
      '2025-05-10 11:42:23');
INSERT INTO dbo.Customers (FacialID, Age, Gender, Emotion, LastUpdateDate) VALUES (
      N'FACE-1026', 
      57, 
      N'Female', 
      N'Concerned', 
      '2025-02-18 17:35:51');
INSERT INTO dbo.Customers (FacialID, Age, Gender, Emotion, LastUpdateDate) VALUES (
      N'FACE-1027', 
      33, 
      N'Unknown', 
      N'Thoughtful', 
      '2025-02-15 01:34:57');
INSERT INTO dbo.Customers (FacialID, Age, Gender, Emotion, LastUpdateDate) VALUES (
      N'FACE-1028', 
      19, 
      N'Male', 
      N'Concerned', 
      '2025-04-23 17:30:09');
INSERT INTO dbo.Customers (FacialID, Age, Gender, Emotion, LastUpdateDate) VALUES (
      N'FACE-1029', 
      61, 
      N'Other', 
      N'Interested', 
      '2025-04-27 07:04:53');
INSERT INTO dbo.Customers (FacialID, Age, Gender, Emotion, LastUpdateDate) VALUES (
      N'FACE-1030', 
      54, 
      N'Unknown', 
      N'Thoughtful', 
      '2025-02-14 01:32:10');
INSERT INTO dbo.Customers (FacialID, Age, Gender, Emotion, LastUpdateDate) VALUES (
      N'FACE-1031', 
      65, 
      N'Female', 
      N'Concerned', 
      '2025-04-29 21:43:53');
INSERT INTO dbo.Customers (FacialID, Age, Gender, Emotion, LastUpdateDate) VALUES (
      N'FACE-1032', 
      60, 
      N'Male', 
      N'Happy', 
      '2025-04-02 03:55:51');
INSERT INTO dbo.Customers (FacialID, Age, Gender, Emotion, LastUpdateDate) VALUES (
      N'FACE-1033', 
      29, 
      N'Other', 
      N'Satisfied', 
      '2025-03-17 00:22:13');
INSERT INTO dbo.Customers (FacialID, Age, Gender, Emotion, LastUpdateDate) VALUES (
      N'FACE-1034', 
      38, 
      N'Male', 
      N'Satisfied', 
      '2025-01-31 04:46:59');
INSERT INTO dbo.Customers (FacialID, Age, Gender, Emotion, LastUpdateDate) VALUES (
      N'FACE-1035', 
      53, 
      N'Other', 
      N'Happy', 
      '2025-01-09 15:09:09');
INSERT INTO dbo.Customers (FacialID, Age, Gender, Emotion, LastUpdateDate) VALUES (
      N'FACE-1036', 
      42, 
      N'Other', 
      N'Concerned', 
      '2025-01-09 22:26:19');
INSERT INTO dbo.Customers (FacialID, Age, Gender, Emotion, LastUpdateDate) VALUES (
      N'FACE-1037', 
      67, 
      N'Other', 
      N'Satisfied', 
      '2025-04-28 05:44:42');
INSERT INTO dbo.Customers (FacialID, Age, Gender, Emotion, LastUpdateDate) VALUES (
      N'FACE-1038', 
      54, 
      N'Unknown', 
      N'Surprised', 
      '2025-03-18 20:40:28');
INSERT INTO dbo.Customers (FacialID, Age, Gender, Emotion, LastUpdateDate) VALUES (
      N'FACE-1039', 
      47, 
      N'Female', 
      N'Neutral', 
      '2025-02-09 08:09:51');
INSERT INTO dbo.Customers (FacialID, Age, Gender, Emotion, LastUpdateDate) VALUES (
      N'FACE-1040', 
      37, 
      N'Unknown', 
      N'Surprised', 
      '2025-03-09 14:54:42');
INSERT INTO dbo.Customers (FacialID, Age, Gender, Emotion, LastUpdateDate) VALUES (
      N'FACE-1041', 
      68, 
      N'Other', 
      N'Surprised', 
      '2025-02-19 10:14:48');
INSERT INTO dbo.Customers (FacialID, Age, Gender, Emotion, LastUpdateDate) VALUES (
      N'FACE-1042', 
      43, 
      N'Male', 
      N'Thoughtful', 
      '2025-04-01 13:25:21');
INSERT INTO dbo.Customers (FacialID, Age, Gender, Emotion, LastUpdateDate) VALUES (
      N'FACE-1043', 
      68, 
      N'Unknown', 
      N'Satisfied', 
      '2025-01-03 05:41:06');
INSERT INTO dbo.Customers (FacialID, Age, Gender, Emotion, LastUpdateDate) VALUES (
      N'FACE-1044', 
      58, 
      N'Unknown', 
      N'Neutral', 
      '2025-03-24 19:23:19');
INSERT INTO dbo.Customers (FacialID, Age, Gender, Emotion, LastUpdateDate) VALUES (
      N'FACE-1045', 
      23, 
      N'Female', 
      N'Neutral', 
      '2025-01-16 02:35:36');
INSERT INTO dbo.Customers (FacialID, Age, Gender, Emotion, LastUpdateDate) VALUES (
      N'FACE-1046', 
      75, 
      N'Female', 
      N'Satisfied', 
      '2025-04-09 15:39:12');
INSERT INTO dbo.Customers (FacialID, Age, Gender, Emotion, LastUpdateDate) VALUES (
      N'FACE-1047', 
      34, 
      N'Male', 
      N'Happy', 
      '2025-05-09 07:22:28');
INSERT INTO dbo.Customers (FacialID, Age, Gender, Emotion, LastUpdateDate) VALUES (
      N'FACE-1048', 
      42, 
      N'Female', 
      N'Thoughtful', 
      '2025-01-17 00:35:55');
INSERT INTO dbo.Customers (FacialID, Age, Gender, Emotion, LastUpdateDate) VALUES (
      N'FACE-1049', 
      60, 
      N'Male', 
      N'Surprised', 
      '2025-05-03 07:36:22');
INSERT INTO dbo.Customers (FacialID, Age, Gender, Emotion, LastUpdateDate) VALUES (
      N'FACE-1050', 
      67, 
      N'Unknown', 
      N'Surprised', 
      '2025-03-25 09:31:55');
GO

DELETE FROM dbo.SalesInteractions;
GO

INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10001', 
      11, 
      25, 
      '2025-03-21 10:56:19', 
      N'DEVICE-1008', 
      N'FACE-1019', 
      N'Other', 
      59, 
      N'Interested', 
      N'Customer asking about Frozen Vegetables. Asked about promotions.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10002', 
      8, 
      6, 
      '2025-02-27 00:25:38', 
      N'DEVICE-1006', 
      N'FACE-1008', 
      N'Male', 
      27, 
      N'Neutral', 
      N'Customer asking about Flour. Asked about promotions.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10003', 
      7, 
      34, 
      '2025-03-24 11:50:39', 
      N'DEVICE-1002', 
      N'FACE-1018', 
      N'Female', 
      25, 
      N'Thoughtful', 
      N'Customer asking about Sugar. Mentioned price comparison.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10004', 
      9, 
      2, 
      '2025-02-03 14:03:32', 
      N'DEVICE-1006', 
      N'FACE-1009', 
      N'Female', 
      43, 
      N'Thoughtful', 
      N'Customer asking about Salt. Asked about promotions.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10005', 
      8, 
      44, 
      '2025-05-12 11:50:50', 
      N'DEVICE-1005', 
      N'FACE-1030', 
      N'Other', 
      54, 
      N'Neutral', 
      N'Customer asking about Crackers. Mentioned price comparison.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10006', 
      7, 
      1, 
      '2025-03-16 12:01:00', 
      N'DEVICE-1004', 
      N'FACE-1041', 
      N'Other', 
      19, 
      N'Interested', 
      N'Customer asking about Honey. Mentioned price comparison.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10007', 
      3, 
      43, 
      '2025-05-09 20:07:48', 
      N'DEVICE-1007', 
      N'FACE-1006', 
      N'Female', 
      65, 
      N'Thoughtful', 
      N'Customer asking about Flour. Mentioned price comparison.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10008', 
      6, 
      9, 
      '2025-01-01 17:19:17', 
      N'DEVICE-1002', 
      N'FACE-1008', 
      N'Male', 
      50, 
      N'Surprised', 
      N'Customer asking about Toothpaste. Asked about promotions.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10009', 
      11, 
      5, 
      '2025-03-26 12:12:20', 
      N'DEVICE-1006', 
      N'FACE-1022', 
      N'Other', 
      32, 
      N'Interested', 
      N'Customer asking about Tea. Mentioned price comparison.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10010', 
      3, 
      42, 
      '2025-03-01 09:11:03', 
      N'DEVICE-1006', 
      N'FACE-1045', 
      N'Other', 
      27, 
      N'Surprised', 
      N'Customer asking about Eggs. Mentioned price comparison.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10011', 
      5, 
      8, 
      '2025-03-10 07:08:00', 
      N'DEVICE-1009', 
      N'FACE-1037', 
      N'Female', 
      60, 
      N'Concerned', 
      N'Customer asking about Vinegar. Mentioned price comparison.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10012', 
      7, 
      26, 
      '2025-03-26 04:27:33', 
      N'DEVICE-1000', 
      N'FACE-1050', 
      N'Male', 
      34, 
      N'Interested', 
      N'Customer asking about Frozen Vegetables. Mentioned price comparison.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10013', 
      15, 
      23, 
      '2025-01-21 02:34:00', 
      N'DEVICE-1002', 
      N'FACE-1011', 
      N'Female', 
      58, 
      N'Thoughtful', 
      N'Customer asking about Cereal. Mentioned price comparison.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10014', 
      11, 
      18, 
      '2025-03-04 00:32:00', 
      N'DEVICE-1003', 
      N'FACE-1007', 
      N'Unknown', 
      38, 
      N'Concerned', 
      N'Customer asking about Mustard. Mentioned price comparison.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10015', 
      9, 
      18, 
      '2025-04-19 16:34:09', 
      N'DEVICE-1001', 
      N'FACE-1003', 
      N'Other', 
      33, 
      N'Surprised', 
      N'Customer asking about Rice. Asked about promotions.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10016', 
      6, 
      50, 
      '2025-02-07 01:41:30', 
      N'DEVICE-1001', 
      N'FACE-1048', 
      N'Female', 
      19, 
      N'Surprised', 
      N'Customer asking about Sugar. Mentioned price comparison.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10017', 
      8, 
      39, 
      '2025-04-15 17:42:54', 
      N'DEVICE-1005', 
      N'FACE-1026', 
      N'Male', 
      73, 
      N'Surprised', 
      N'Customer asking about Cat Food. Asked about promotions.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10018', 
      2, 
      9, 
      '2025-05-13 10:53:24', 
      N'DEVICE-1004', 
      N'FACE-1050', 
      N'Unknown', 
      62, 
      N'Neutral', 
      N'Customer asking about Vinegar. Asked about promotions.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10019', 
      7, 
      32, 
      '2025-01-29 21:52:26', 
      N'DEVICE-1003', 
      N'FACE-1013', 
      N'Male', 
      24, 
      N'Surprised', 
      N'Customer asking about Pepper. Mentioned price comparison.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10020', 
      12, 
      9, 
      '2025-04-09 00:08:29', 
      N'DEVICE-1007', 
      N'FACE-1043', 
      N'Unknown', 
      56, 
      N'Happy', 
      N'Customer asking about Mayonnaise. Asked about promotions.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10021', 
      10, 
      4, 
      '2025-02-25 22:19:47', 
      N'DEVICE-1007', 
      N'FACE-1033', 
      N'Male', 
      65, 
      N'Thoughtful', 
      N'Customer asking about Cat Food. Mentioned price comparison.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10022', 
      11, 
      11, 
      '2025-01-27 07:06:53', 
      N'DEVICE-1001', 
      N'FACE-1006', 
      N'Male', 
      66, 
      N'Neutral', 
      N'Customer asking about Tea. Asked about promotions.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10023', 
      3, 
      30, 
      '2025-01-25 15:59:39', 
      N'DEVICE-1001', 
      N'FACE-1008', 
      N'Female', 
      44, 
      N'Interested', 
      N'Customer asking about Cereal. Mentioned price comparison.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10024', 
      4, 
      38, 
      '2025-04-13 23:44:36', 
      N'DEVICE-1009', 
      N'FACE-1035', 
      N'Other', 
      59, 
      N'Happy', 
      N'Customer asking about Toothpaste. Asked about promotions.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10025', 
      9, 
      40, 
      '2025-03-25 07:23:19', 
      N'DEVICE-1007', 
      N'FACE-1037', 
      N'Male', 
      25, 
      N'Surprised', 
      N'Customer asking about Mustard. Mentioned price comparison.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10026', 
      12, 
      43, 
      '2025-05-07 00:53:03', 
      N'DEVICE-1009', 
      N'FACE-1017', 
      N'Male', 
      37, 
      N'Satisfied', 
      N'Customer asking about Coffee. Asked about promotions.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10027', 
      12, 
      14, 
      '2025-03-19 10:17:59', 
      N'DEVICE-1007', 
      N'FACE-1036', 
      N'Male', 
      30, 
      N'Interested', 
      N'Customer asking about Butter. Mentioned price comparison.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10028', 
      1, 
      17, 
      '2025-01-13 09:02:34', 
      N'DEVICE-1003', 
      N'FACE-1002', 
      N'Female', 
      32, 
      N'Thoughtful', 
      N'Customer asking about Sugar. Mentioned price comparison.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10029', 
      10, 
      6, 
      '2025-03-25 21:02:22', 
      N'DEVICE-1002', 
      N'FACE-1013', 
      N'Other', 
      64, 
      N'Interested', 
      N'Customer asking about Canned Tuna. Mentioned price comparison.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10030', 
      12, 
      1, 
      '2025-01-10 01:10:03', 
      N'DEVICE-1004', 
      N'FACE-1003', 
      N'Female', 
      56, 
      N'Happy', 
      N'Customer asking about Crackers. Asked about promotions.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10031', 
      10, 
      50, 
      '2025-04-11 12:14:11', 
      N'DEVICE-1009', 
      N'FACE-1020', 
      N'Male', 
      68, 
      N'Satisfied', 
      N'Customer asking about Pepper. Mentioned price comparison.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10032', 
      9, 
      14, 
      '2025-02-10 19:19:16', 
      N'DEVICE-1003', 
      N'FACE-1020', 
      N'Unknown', 
      50, 
      N'Thoughtful', 
      N'Customer asking about Juice. Mentioned price comparison.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10033', 
      6, 
      37, 
      '2025-04-12 00:58:18', 
      N'DEVICE-1004', 
      N'FACE-1032', 
      N'Unknown', 
      74, 
      N'Thoughtful', 
      N'Customer asking about Shampoo. Asked about promotions.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10034', 
      9, 
      1, 
      '2025-03-15 17:07:24', 
      N'DEVICE-1009', 
      N'FACE-1012', 
      N'Female', 
      69, 
      N'Interested', 
      N'Customer asking about Shampoo. Asked about promotions.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10035', 
      9, 
      24, 
      '2025-01-14 17:23:48', 
      N'DEVICE-1009', 
      N'FACE-1050', 
      N'Male', 
      56, 
      N'Interested', 
      N'Customer asking about Vinegar. Mentioned price comparison.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10036', 
      11, 
      15, 
      '2025-01-13 22:53:16', 
      N'DEVICE-1007', 
      N'FACE-1022', 
      N'Unknown', 
      41, 
      N'Interested', 
      N'Customer asking about Eggs. Asked about promotions.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10037', 
      2, 
      50, 
      '2025-01-29 22:15:43', 
      N'DEVICE-1009', 
      N'FACE-1034', 
      N'Unknown', 
      58, 
      N'Interested', 
      N'Customer asking about Soft Drink. Mentioned price comparison.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10038', 
      4, 
      25, 
      '2025-01-14 03:45:01', 
      N'DEVICE-1002', 
      N'FACE-1043', 
      N'Unknown', 
      46, 
      N'Neutral', 
      N'Customer asking about Body Wash. Asked about promotions.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10039', 
      13, 
      8, 
      '2025-01-24 12:30:24', 
      N'DEVICE-1006', 
      N'FACE-1018', 
      N'Unknown', 
      66, 
      N'Concerned', 
      N'Customer asking about Canned Tuna. Mentioned price comparison.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10040', 
      14, 
      46, 
      '2025-05-13 07:37:45', 
      N'DEVICE-1006', 
      N'FACE-1032', 
      N'Female', 
      69, 
      N'Surprised', 
      N'Customer asking about Frozen Vegetables. Asked about promotions.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10041', 
      6, 
      31, 
      '2025-03-27 17:29:38', 
      N'DEVICE-1003', 
      N'FACE-1017', 
      N'Unknown', 
      36, 
      N'Thoughtful', 
      N'Customer asking about Cookies. Asked about promotions.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10042', 
      13, 
      10, 
      '2025-03-05 13:52:36', 
      N'DEVICE-1002', 
      N'FACE-1030', 
      N'Other', 
      70, 
      N'Thoughtful', 
      N'Customer asking about Toilet Paper. Mentioned price comparison.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10043', 
      9, 
      17, 
      '2025-04-19 22:11:18', 
      N'DEVICE-1008', 
      N'FACE-1010', 
      N'Other', 
      50, 
      N'Interested', 
      N'Customer asking about Soy Sauce. Mentioned price comparison.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10044', 
      4, 
      47, 
      '2025-01-28 16:38:12', 
      N'DEVICE-1007', 
      N'FACE-1011', 
      N'Unknown', 
      29, 
      N'Concerned', 
      N'Customer asking about Dish Soap. Asked about promotions.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10045', 
      14, 
      6, 
      '2025-03-21 02:44:09', 
      N'DEVICE-1007', 
      N'FACE-1026', 
      N'Male', 
      51, 
      N'Satisfied', 
      N'Customer asking about Canned Tuna. Asked about promotions.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10046', 
      8, 
      24, 
      '2025-02-13 12:34:24', 
      N'DEVICE-1009', 
      N'FACE-1019', 
      N'Female', 
      34, 
      N'Interested', 
      N'Customer asking about Coffee. Asked about promotions.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10047', 
      13, 
      31, 
      '2025-05-18 17:56:40', 
      N'DEVICE-1003', 
      N'FACE-1020', 
      N'Unknown', 
      36, 
      N'Neutral', 
      N'Customer asking about Juice. Asked about promotions.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10048', 
      13, 
      3, 
      '2025-01-09 23:07:31', 
      N'DEVICE-1004', 
      N'FACE-1047', 
      N'Male', 
      55, 
      N'Interested', 
      N'Customer asking about Dog Food. Asked about promotions.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10049', 
      7, 
      25, 
      '2025-02-18 12:20:01', 
      N'DEVICE-1009', 
      N'FACE-1015', 
      N'Unknown', 
      66, 
      N'Thoughtful', 
      N'Customer asking about Sugar. Mentioned price comparison.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10050', 
      12, 
      34, 
      '2025-03-28 12:02:14', 
      N'DEVICE-1003', 
      N'FACE-1019', 
      N'Unknown', 
      40, 
      N'Surprised', 
      N'Customer asking about Toothpaste. Asked about promotions.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10051', 
      13, 
      13, 
      '2025-05-14 20:34:29', 
      N'DEVICE-1006', 
      N'FACE-1008', 
      N'Other', 
      51, 
      N'Thoughtful', 
      N'Customer asking about Coffee. Mentioned price comparison.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10052', 
      2, 
      36, 
      '2025-01-14 08:31:16', 
      N'DEVICE-1004', 
      N'FACE-1026', 
      N'Other', 
      57, 
      N'Thoughtful', 
      N'Customer asking about Cereal. Mentioned price comparison.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10053', 
      13, 
      14, 
      '2025-02-26 02:08:16', 
      N'DEVICE-1005', 
      N'FACE-1044', 
      N'Unknown', 
      72, 
      N'Neutral', 
      N'Customer asking about Chips. Mentioned price comparison.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10054', 
      8, 
      17, 
      '2025-03-23 10:50:26', 
      N'DEVICE-1003', 
      N'FACE-1043', 
      N'Other', 
      44, 
      N'Neutral', 
      N'Customer asking about Honey. Mentioned price comparison.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10055', 
      11, 
      2, 
      '2025-04-02 07:41:54', 
      N'DEVICE-1008', 
      N'FACE-1003', 
      N'Other', 
      68, 
      N'Happy', 
      N'Customer asking about Cat Food. Mentioned price comparison.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10056', 
      10, 
      19, 
      '2025-02-14 21:53:21', 
      N'DEVICE-1007', 
      N'FACE-1024', 
      N'Female', 
      68, 
      N'Thoughtful', 
      N'Customer asking about Canned Tuna. Mentioned price comparison.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10057', 
      15, 
      24, 
      '2025-03-29 02:01:15', 
      N'DEVICE-1008', 
      N'FACE-1021', 
      N'Other', 
      33, 
      N'Thoughtful', 
      N'Customer asking about Shampoo. Asked about promotions.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10058', 
      7, 
      47, 
      '2025-05-15 02:02:02', 
      N'DEVICE-1000', 
      N'FACE-1050', 
      N'Other', 
      69, 
      N'Interested', 
      N'Customer asking about Pepper. Mentioned price comparison.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10059', 
      1, 
      13, 
      '2025-03-13 00:31:01', 
      N'DEVICE-1008', 
      N'FACE-1038', 
      N'Other', 
      64, 
      N'Neutral', 
      N'Customer asking about Crackers. Asked about promotions.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10060', 
      11, 
      17, 
      '2025-02-25 12:53:34', 
      N'DEVICE-1008', 
      N'FACE-1026', 
      N'Male', 
      55, 
      N'Satisfied', 
      N'Customer asking about Cookies. Mentioned price comparison.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10061', 
      9, 
      5, 
      '2025-02-18 04:10:34', 
      N'DEVICE-1002', 
      N'FACE-1001', 
      N'Other', 
      41, 
      N'Concerned', 
      N'Customer asking about Diapers. Asked about promotions.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10062', 
      14, 
      2, 
      '2025-02-04 15:39:59', 
      N'DEVICE-1003', 
      N'FACE-1014', 
      N'Unknown', 
      48, 
      N'Thoughtful', 
      N'Customer asking about Ketchup. Mentioned price comparison.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10063', 
      1, 
      21, 
      '2025-03-07 01:44:53', 
      N'DEVICE-1002', 
      N'FACE-1003', 
      N'Unknown', 
      51, 
      N'Happy', 
      N'Customer asking about Water. Asked about promotions.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10064', 
      15, 
      35, 
      '2025-01-10 13:50:09', 
      N'DEVICE-1009', 
      N'FACE-1049', 
      N'Female', 
      63, 
      N'Neutral', 
      N'Customer asking about Toothpaste. Asked about promotions.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10065', 
      11, 
      30, 
      '2025-04-29 01:46:15', 
      N'DEVICE-1003', 
      N'FACE-1003', 
      N'Female', 
      71, 
      N'Interested', 
      N'Customer asking about Rice. Asked about promotions.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10066', 
      11, 
      36, 
      '2025-05-12 07:21:42', 
      N'DEVICE-1009', 
      N'FACE-1048', 
      N'Male', 
      42, 
      N'Concerned', 
      N'Customer asking about Toilet Paper. Mentioned price comparison.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10067', 
      3, 
      19, 
      '2025-03-31 08:11:04', 
      N'DEVICE-1002', 
      N'FACE-1023', 
      N'Other', 
      31, 
      N'Happy', 
      N'Customer asking about Honey. Mentioned price comparison.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10068', 
      15, 
      39, 
      '2025-03-21 02:28:07', 
      N'DEVICE-1009', 
      N'FACE-1038', 
      N'Female', 
      61, 
      N'Happy', 
      N'Customer asking about Vinegar. Asked about promotions.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10069', 
      4, 
      26, 
      '2025-04-18 11:26:35', 
      N'DEVICE-1001', 
      N'FACE-1026', 
      N'Unknown', 
      52, 
      N'Surprised', 
      N'Customer asking about Canned Tuna. Asked about promotions.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10070', 
      13, 
      18, 
      '2025-03-07 07:06:41', 
      N'DEVICE-1007', 
      N'FACE-1025', 
      N'Female', 
      69, 
      N'Surprised', 
      N'Customer asking about Canned Tuna. Mentioned price comparison.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10071', 
      7, 
      12, 
      '2025-02-02 03:20:30', 
      N'DEVICE-1002', 
      N'FACE-1015', 
      N'Male', 
      34, 
      N'Thoughtful', 
      N'Customer asking about Laundry Detergent. Mentioned price comparison.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10072', 
      9, 
      32, 
      '2025-01-11 14:17:07', 
      N'DEVICE-1002', 
      N'FACE-1047', 
      N'Male', 
      60, 
      N'Satisfied', 
      N'Customer asking about Juice. Mentioned price comparison.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10073', 
      4, 
      18, 
      '2025-05-07 06:02:51', 
      N'DEVICE-1009', 
      N'FACE-1048', 
      N'Other', 
      36, 
      N'Satisfied', 
      N'Customer asking about Soy Sauce. Mentioned price comparison.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10074', 
      9, 
      21, 
      '2025-03-10 05:11:15', 
      N'DEVICE-1004', 
      N'FACE-1025', 
      N'Male', 
      68, 
      N'Satisfied', 
      N'Customer asking about Rice. Asked about promotions.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10075', 
      6, 
      28, 
      '2025-01-11 22:01:06', 
      N'DEVICE-1000', 
      N'FACE-1002', 
      N'Female', 
      73, 
      N'Thoughtful', 
      N'Customer asking about Rice. Asked about promotions.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10076', 
      13, 
      24, 
      '2025-05-09 06:18:47', 
      N'DEVICE-1006', 
      N'FACE-1004', 
      N'Other', 
      22, 
      N'Neutral', 
      N'Customer asking about Toothpaste. Asked about promotions.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10077', 
      9, 
      38, 
      '2025-04-12 14:46:29', 
      N'DEVICE-1007', 
      N'FACE-1021', 
      N'Male', 
      47, 
      N'Satisfied', 
      N'Customer asking about Dog Food. Mentioned price comparison.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10078', 
      12, 
      7, 
      '2025-03-20 02:17:10', 
      N'DEVICE-1007', 
      N'FACE-1034', 
      N'Male', 
      53, 
      N'Concerned', 
      N'Customer asking about Sugar. Asked about promotions.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10079', 
      11, 
      3, 
      '2025-03-09 00:42:33', 
      N'DEVICE-1007', 
      N'FACE-1048', 
      N'Female', 
      37, 
      N'Satisfied', 
      N'Customer asking about Facial Tissue. Mentioned price comparison.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10080', 
      9, 
      10, 
      '2025-01-16 02:26:53', 
      N'DEVICE-1007', 
      N'FACE-1015', 
      N'Male', 
      21, 
      N'Satisfied', 
      N'Customer asking about Body Wash. Mentioned price comparison.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10081', 
      13, 
      15, 
      '2025-01-05 19:33:41', 
      N'DEVICE-1002', 
      N'FACE-1029', 
      N'Male', 
      73, 
      N'Concerned', 
      N'Customer asking about Water. Mentioned price comparison.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10082', 
      13, 
      17, 
      '2025-03-08 04:43:18', 
      N'DEVICE-1004', 
      N'FACE-1001', 
      N'Female', 
      53, 
      N'Neutral', 
      N'Customer asking about Laundry Detergent. Asked about promotions.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10083', 
      2, 
      15, 
      '2025-05-02 23:22:44', 
      N'DEVICE-1006', 
      N'FACE-1010', 
      N'Female', 
      32, 
      N'Happy', 
      N'Customer asking about Facial Tissue. Mentioned price comparison.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10084', 
      14, 
      28, 
      '2025-01-25 16:14:29', 
      N'DEVICE-1000', 
      N'FACE-1013', 
      N'Female', 
      73, 
      N'Happy', 
      N'Customer asking about Diapers. Asked about promotions.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10085', 
      4, 
      24, 
      '2025-02-10 00:53:26', 
      N'DEVICE-1005', 
      N'FACE-1016', 
      N'Female', 
      36, 
      N'Concerned', 
      N'Customer asking about Laundry Detergent. Asked about promotions.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10086', 
      15, 
      29, 
      '2025-02-17 09:36:48', 
      N'DEVICE-1001', 
      N'FACE-1011', 
      N'Male', 
      44, 
      N'Satisfied', 
      N'Customer asking about Soft Drink. Asked about promotions.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10087', 
      14, 
      31, 
      '2025-04-15 10:43:22', 
      N'DEVICE-1003', 
      N'FACE-1016', 
      N'Female', 
      41, 
      N'Happy', 
      N'Customer asking about Chocolate. Asked about promotions.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10088', 
      6, 
      38, 
      '2025-01-04 00:44:37', 
      N'DEVICE-1002', 
      N'FACE-1003', 
      N'Male', 
      36, 
      N'Happy', 
      N'Customer asking about Bread. Asked about promotions.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10089', 
      3, 
      13, 
      '2025-01-25 05:52:25', 
      N'DEVICE-1009', 
      N'FACE-1047', 
      N'Other', 
      27, 
      N'Concerned', 
      N'Customer asking about Pasta. Mentioned price comparison.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10090', 
      12, 
      23, 
      '2025-02-17 12:45:05', 
      N'DEVICE-1005', 
      N'FACE-1018', 
      N'Unknown', 
      43, 
      N'Interested', 
      N'Customer asking about Juice. Asked about promotions.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10091', 
      11, 
      21, 
      '2025-01-16 00:17:07', 
      N'DEVICE-1007', 
      N'FACE-1024', 
      N'Female', 
      37, 
      N'Satisfied', 
      N'Customer asking about Soy Sauce. Mentioned price comparison.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10092', 
      3, 
      11, 
      '2025-03-12 02:02:54', 
      N'DEVICE-1005', 
      N'FACE-1023', 
      N'Male', 
      35, 
      N'Surprised', 
      N'Customer asking about Toilet Paper. Mentioned price comparison.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10093', 
      10, 
      2, 
      '2025-01-07 06:32:31', 
      N'DEVICE-1009', 
      N'FACE-1020', 
      N'Female', 
      70, 
      N'Happy', 
      N'Customer asking about Butter. Mentioned price comparison.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10094', 
      6, 
      45, 
      '2025-01-26 16:22:58', 
      N'DEVICE-1009', 
      N'FACE-1010', 
      N'Male', 
      66, 
      N'Happy', 
      N'Customer asking about Canned Tuna. Asked about promotions.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10095', 
      3, 
      42, 
      '2025-03-27 10:16:52', 
      N'DEVICE-1002', 
      N'FACE-1038', 
      N'Unknown', 
      58, 
      N'Neutral', 
      N'Customer asking about Butter. Asked about promotions.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10096', 
      11, 
      27, 
      '2025-04-07 23:37:10', 
      N'DEVICE-1002', 
      N'FACE-1015', 
      N'Female', 
      42, 
      N'Thoughtful', 
      N'Customer asking about Juice. Mentioned price comparison.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10097', 
      11, 
      36, 
      '2025-02-10 19:01:03', 
      N'DEVICE-1008', 
      N'FACE-1003', 
      N'Female', 
      44, 
      N'Thoughtful', 
      N'Customer asking about Ice Cream. Asked about promotions.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10098', 
      8, 
      37, 
      '2025-04-06 08:14:09', 
      N'DEVICE-1001', 
      N'FACE-1024', 
      N'Male', 
      28, 
      N'Thoughtful', 
      N'Customer asking about Soy Sauce. Asked about promotions.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10099', 
      15, 
      32, 
      '2025-02-03 14:44:42', 
      N'DEVICE-1000', 
      N'FACE-1041', 
      N'Female', 
      57, 
      N'Happy', 
      N'Customer asking about Chocolate. Mentioned price comparison.');
INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      'INT-10100', 
      6, 
      32, 
      '2025-04-27 22:15:10', 
      N'DEVICE-1003', 
      N'FACE-1049', 
      N'Female', 
      53, 
      N'Neutral', 
      N'Customer asking about Juice. Asked about promotions.');
GO

DELETE FROM dbo.TransactionItems;
GO

SET IDENTITY_INSERT dbo.TransactionItems ON;
GO

INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      1, 
      'INT-10001', 
      10, 
      1, 
      436.79, 
      0, 
      'Availability Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      2, 
      'INT-10001', 
      12, 
      3, 
      72.89, 
      1, 
      'Price Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      3, 
      'INT-10001', 
      20, 
      3, 
      178.81, 
      2, 
      'Price Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      4, 
      'INT-10001', 
      36, 
      1, 
      493.26, 
      3, 
      'Direct Request');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      5, 
      'INT-10001', 
      11, 
      5, 
      63.4, 
      4, 
      'Price Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      6, 
      'INT-10002', 
      47, 
      3, 
      53.39, 
      0, 
      'Direct Request');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      7, 
      'INT-10002', 
      32, 
      3, 
      149.78, 
      1, 
      'Direct Request');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      8, 
      'INT-10002', 
      47, 
      4, 
      341.14, 
      2, 
      'Price Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      9, 
      'INT-10002', 
      41, 
      4, 
      171.43, 
      3, 
      'Direct Request');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      10, 
      'INT-10003', 
      27, 
      3, 
      53.57, 
      0, 
      'Comparison');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      11, 
      'INT-10003', 
      16, 
      5, 
      52.01, 
      1, 
      'Direct Request');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      12, 
      'INT-10003', 
      34, 
      2, 
      481.25, 
      2, 
      'Direct Request');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      13, 
      'INT-10004', 
      28, 
      2, 
      20.37, 
      0, 
      'Price Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      14, 
      'INT-10004', 
      39, 
      2, 
      350.28, 
      1, 
      'Comparison');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      15, 
      'INT-10005', 
      26, 
      3, 
      108.81, 
      0, 
      'Recommendation');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      16, 
      'INT-10006', 
      40, 
      2, 
      213.97, 
      0, 
      'Price Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      17, 
      'INT-10006', 
      13, 
      3, 
      226.35, 
      1, 
      'Inquiry');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      18, 
      'INT-10006', 
      37, 
      1, 
      353.07, 
      2, 
      'Recommendation');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      19, 
      'INT-10006', 
      18, 
      1, 
      281.09, 
      3, 
      'Recommendation');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      20, 
      'INT-10006', 
      49, 
      3, 
      418.33, 
      4, 
      'Recommendation');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      21, 
      'INT-10007', 
      7, 
      5, 
      401.92, 
      0, 
      'Direct Request');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      22, 
      'INT-10007', 
      23, 
      2, 
      157.14, 
      1, 
      'Price Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      23, 
      'INT-10008', 
      26, 
      3, 
      480.97, 
      0, 
      'Availability Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      24, 
      'INT-10008', 
      15, 
      5, 
      50.9, 
      1, 
      'Inquiry');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      25, 
      'INT-10008', 
      10, 
      1, 
      83.88, 
      2, 
      'Price Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      26, 
      'INT-10008', 
      44, 
      5, 
      226.46, 
      3, 
      'Price Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      27, 
      'INT-10008', 
      46, 
      3, 
      431.57, 
      4, 
      'Recommendation');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      28, 
      'INT-10009', 
      40, 
      3, 
      250.91, 
      0, 
      'Price Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      29, 
      'INT-10009', 
      41, 
      1, 
      405.76, 
      1, 
      'Recommendation');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      30, 
      'INT-10010', 
      40, 
      4, 
      30.11, 
      0, 
      'Inquiry');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      31, 
      'INT-10010', 
      50, 
      1, 
      294.2, 
      1, 
      'Direct Request');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      32, 
      'INT-10011', 
      2, 
      1, 
      452.94, 
      0, 
      'Comparison');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      33, 
      'INT-10011', 
      43, 
      4, 
      214.53, 
      1, 
      'Price Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      34, 
      'INT-10012', 
      42, 
      3, 
      16.99, 
      0, 
      'Inquiry');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      35, 
      'INT-10012', 
      49, 
      1, 
      168.42, 
      1, 
      'Direct Request');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      36, 
      'INT-10013', 
      47, 
      1, 
      440.37, 
      0, 
      'Availability Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      37, 
      'INT-10013', 
      5, 
      4, 
      135.19, 
      1, 
      'Inquiry');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      38, 
      'INT-10013', 
      44, 
      2, 
      310.36, 
      2, 
      'Direct Request');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      39, 
      'INT-10014', 
      47, 
      2, 
      377.21, 
      0, 
      'Price Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      40, 
      'INT-10015', 
      9, 
      3, 
      221.96, 
      0, 
      'Inquiry');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      41, 
      'INT-10015', 
      44, 
      5, 
      247.18, 
      1, 
      'Price Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      42, 
      'INT-10015', 
      35, 
      1, 
      332.3, 
      2, 
      'Comparison');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      43, 
      'INT-10015', 
      3, 
      5, 
      107.26, 
      3, 
      'Recommendation');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      44, 
      'INT-10016', 
      10, 
      1, 
      73.16, 
      0, 
      'Comparison');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      45, 
      'INT-10016', 
      36, 
      3, 
      113.02, 
      1, 
      'Comparison');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      46, 
      'INT-10016', 
      48, 
      1, 
      236.39, 
      2, 
      'Availability Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      47, 
      'INT-10016', 
      12, 
      3, 
      136.32, 
      3, 
      'Inquiry');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      48, 
      'INT-10016', 
      48, 
      5, 
      427.94, 
      4, 
      'Availability Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      49, 
      'INT-10017', 
      46, 
      3, 
      12.04, 
      0, 
      'Comparison');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      50, 
      'INT-10018', 
      18, 
      2, 
      166.52, 
      0, 
      'Availability Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      51, 
      'INT-10018', 
      26, 
      2, 
      72.5, 
      1, 
      'Availability Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      52, 
      'INT-10018', 
      22, 
      5, 
      149.78, 
      2, 
      'Availability Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      53, 
      'INT-10019', 
      21, 
      1, 
      468.08, 
      0, 
      'Price Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      54, 
      'INT-10019', 
      9, 
      4, 
      286.03, 
      1, 
      'Price Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      55, 
      'INT-10019', 
      12, 
      5, 
      388.16, 
      2, 
      'Recommendation');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      56, 
      'INT-10020', 
      23, 
      4, 
      151.27, 
      0, 
      'Availability Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      57, 
      'INT-10020', 
      16, 
      2, 
      286.53, 
      1, 
      'Direct Request');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      58, 
      'INT-10020', 
      32, 
      1, 
      34.88, 
      2, 
      'Comparison');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      59, 
      'INT-10021', 
      21, 
      1, 
      446.74, 
      0, 
      'Inquiry');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      60, 
      'INT-10021', 
      49, 
      3, 
      64.65, 
      1, 
      'Price Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      61, 
      'INT-10021', 
      27, 
      5, 
      50.84, 
      2, 
      'Price Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      62, 
      'INT-10022', 
      15, 
      1, 
      445.3, 
      0, 
      'Inquiry');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      63, 
      'INT-10022', 
      21, 
      3, 
      127.17, 
      1, 
      'Availability Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      64, 
      'INT-10023', 
      1, 
      5, 
      242.78, 
      0, 
      'Comparison');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      65, 
      'INT-10023', 
      8, 
      3, 
      257.33, 
      1, 
      'Recommendation');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      66, 
      'INT-10024', 
      16, 
      4, 
      107.42, 
      0, 
      'Availability Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      67, 
      'INT-10024', 
      22, 
      2, 
      276.23, 
      1, 
      'Direct Request');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      68, 
      'INT-10025', 
      49, 
      2, 
      178.21, 
      0, 
      'Recommendation');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      69, 
      'INT-10025', 
      35, 
      4, 
      322.04, 
      1, 
      'Inquiry');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      70, 
      'INT-10025', 
      25, 
      5, 
      249.07, 
      2, 
      'Inquiry');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      71, 
      'INT-10025', 
      33, 
      2, 
      239.25, 
      3, 
      'Direct Request');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      72, 
      'INT-10026', 
      35, 
      1, 
      49.76, 
      0, 
      'Inquiry');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      73, 
      'INT-10026', 
      35, 
      5, 
      239.88, 
      1, 
      'Price Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      74, 
      'INT-10026', 
      48, 
      5, 
      451.87, 
      2, 
      'Availability Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      75, 
      'INT-10027', 
      42, 
      2, 
      250.33, 
      0, 
      'Direct Request');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      76, 
      'INT-10027', 
      23, 
      2, 
      356.47, 
      1, 
      'Direct Request');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      77, 
      'INT-10028', 
      34, 
      1, 
      26.91, 
      0, 
      'Price Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      78, 
      'INT-10028', 
      33, 
      2, 
      326.42, 
      1, 
      'Inquiry');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      79, 
      'INT-10028', 
      45, 
      5, 
      444.87, 
      2, 
      'Inquiry');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      80, 
      'INT-10028', 
      12, 
      1, 
      246.55, 
      3, 
      'Recommendation');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      81, 
      'INT-10029', 
      47, 
      2, 
      374.12, 
      0, 
      'Inquiry');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      82, 
      'INT-10030', 
      13, 
      3, 
      109.01, 
      0, 
      'Price Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      83, 
      'INT-10030', 
      17, 
      3, 
      199.53, 
      1, 
      'Inquiry');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      84, 
      'INT-10031', 
      10, 
      3, 
      470.11, 
      0, 
      'Direct Request');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      85, 
      'INT-10031', 
      29, 
      3, 
      267.98, 
      1, 
      'Price Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      86, 
      'INT-10031', 
      26, 
      2, 
      139.02, 
      2, 
      'Availability Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      87, 
      'INT-10031', 
      31, 
      3, 
      11.29, 
      3, 
      'Inquiry');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      88, 
      'INT-10031', 
      50, 
      5, 
      189.69, 
      4, 
      'Inquiry');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      89, 
      'INT-10032', 
      5, 
      5, 
      95.09, 
      0, 
      'Inquiry');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      90, 
      'INT-10032', 
      45, 
      3, 
      289.19, 
      1, 
      'Price Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      91, 
      'INT-10032', 
      1, 
      5, 
      55.5, 
      2, 
      'Comparison');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      92, 
      'INT-10032', 
      19, 
      3, 
      102.68, 
      3, 
      'Price Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      93, 
      'INT-10033', 
      16, 
      4, 
      246.5, 
      0, 
      'Availability Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      94, 
      'INT-10033', 
      14, 
      1, 
      159.72, 
      1, 
      'Price Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      95, 
      'INT-10033', 
      7, 
      5, 
      179.23, 
      2, 
      'Price Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      96, 
      'INT-10034', 
      13, 
      1, 
      333.47, 
      0, 
      'Direct Request');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      97, 
      'INT-10034', 
      1, 
      1, 
      30.97, 
      1, 
      'Direct Request');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      98, 
      'INT-10034', 
      13, 
      3, 
      110.34, 
      2, 
      'Availability Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      99, 
      'INT-10035', 
      44, 
      5, 
      21.47, 
      0, 
      'Comparison');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      100, 
      'INT-10035', 
      6, 
      2, 
      252.16, 
      1, 
      'Inquiry');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      101, 
      'INT-10036', 
      13, 
      5, 
      141.97, 
      0, 
      'Inquiry');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      102, 
      'INT-10036', 
      19, 
      3, 
      118.95, 
      1, 
      'Comparison');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      103, 
      'INT-10036', 
      29, 
      3, 
      107.26, 
      2, 
      'Recommendation');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      104, 
      'INT-10036', 
      19, 
      4, 
      31.74, 
      3, 
      'Comparison');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      105, 
      'INT-10037', 
      33, 
      1, 
      84.64, 
      0, 
      'Price Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      106, 
      'INT-10038', 
      2, 
      4, 
      351.23, 
      0, 
      'Inquiry');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      107, 
      'INT-10039', 
      45, 
      1, 
      294.29, 
      0, 
      'Inquiry');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      108, 
      'INT-10039', 
      31, 
      3, 
      195.49, 
      1, 
      'Recommendation');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      109, 
      'INT-10040', 
      22, 
      4, 
      437.77, 
      0, 
      'Comparison');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      110, 
      'INT-10040', 
      29, 
      1, 
      265.43, 
      1, 
      'Inquiry');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      111, 
      'INT-10040', 
      36, 
      2, 
      252.78, 
      2, 
      'Availability Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      112, 
      'INT-10040', 
      10, 
      3, 
      234.34, 
      3, 
      'Availability Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      113, 
      'INT-10041', 
      4, 
      3, 
      216.28, 
      0, 
      'Recommendation');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      114, 
      'INT-10041', 
      19, 
      1, 
      385.52, 
      1, 
      'Direct Request');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      115, 
      'INT-10041', 
      1, 
      5, 
      84.41, 
      2, 
      'Inquiry');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      116, 
      'INT-10042', 
      34, 
      1, 
      250.33, 
      0, 
      'Comparison');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      117, 
      'INT-10042', 
      46, 
      5, 
      164.28, 
      1, 
      'Recommendation');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      118, 
      'INT-10043', 
      30, 
      3, 
      313.31, 
      0, 
      'Recommendation');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      119, 
      'INT-10043', 
      11, 
      2, 
      101.5, 
      1, 
      'Direct Request');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      120, 
      'INT-10043', 
      4, 
      5, 
      485.96, 
      2, 
      'Direct Request');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      121, 
      'INT-10043', 
      10, 
      1, 
      347, 
      3, 
      'Inquiry');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      122, 
      'INT-10044', 
      49, 
      1, 
      79.97, 
      0, 
      'Recommendation');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      123, 
      'INT-10044', 
      20, 
      4, 
      336.21, 
      1, 
      'Direct Request');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      124, 
      'INT-10045', 
      25, 
      1, 
      327.71, 
      0, 
      'Inquiry');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      125, 
      'INT-10045', 
      16, 
      1, 
      296.92, 
      1, 
      'Comparison');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      126, 
      'INT-10046', 
      8, 
      2, 
      410.16, 
      0, 
      'Direct Request');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      127, 
      'INT-10046', 
      7, 
      5, 
      22.17, 
      1, 
      'Direct Request');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      128, 
      'INT-10046', 
      8, 
      5, 
      179.03, 
      2, 
      'Price Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      129, 
      'INT-10046', 
      20, 
      5, 
      52.26, 
      3, 
      'Recommendation');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      130, 
      'INT-10046', 
      49, 
      3, 
      72.04, 
      4, 
      'Availability Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      131, 
      'INT-10047', 
      15, 
      5, 
      297.28, 
      0, 
      'Inquiry');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      132, 
      'INT-10047', 
      19, 
      4, 
      364.97, 
      1, 
      'Comparison');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      133, 
      'INT-10047', 
      33, 
      5, 
      13.61, 
      2, 
      'Direct Request');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      134, 
      'INT-10047', 
      36, 
      5, 
      428.25, 
      3, 
      'Price Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      135, 
      'INT-10047', 
      25, 
      5, 
      286.09, 
      4, 
      'Price Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      136, 
      'INT-10048', 
      7, 
      4, 
      327.62, 
      0, 
      'Inquiry');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      137, 
      'INT-10048', 
      48, 
      1, 
      482.9, 
      1, 
      'Inquiry');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      138, 
      'INT-10049', 
      9, 
      5, 
      205.34, 
      0, 
      'Direct Request');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      139, 
      'INT-10049', 
      2, 
      3, 
      308.82, 
      1, 
      'Direct Request');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      140, 
      'INT-10049', 
      10, 
      5, 
      161.91, 
      2, 
      'Availability Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      141, 
      'INT-10049', 
      45, 
      5, 
      328.51, 
      3, 
      'Comparison');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      142, 
      'INT-10050', 
      2, 
      2, 
      355.97, 
      0, 
      'Inquiry');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      143, 
      'INT-10050', 
      40, 
      5, 
      11.13, 
      1, 
      'Availability Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      144, 
      'INT-10050', 
      17, 
      1, 
      149.24, 
      2, 
      'Price Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      145, 
      'INT-10051', 
      23, 
      4, 
      407.73, 
      0, 
      'Availability Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      146, 
      'INT-10051', 
      2, 
      5, 
      198.58, 
      1, 
      'Availability Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      147, 
      'INT-10051', 
      41, 
      5, 
      218.05, 
      2, 
      'Price Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      148, 
      'INT-10051', 
      15, 
      4, 
      382.66, 
      3, 
      'Availability Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      149, 
      'INT-10051', 
      7, 
      1, 
      465.07, 
      4, 
      'Inquiry');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      150, 
      'INT-10052', 
      7, 
      3, 
      151.99, 
      0, 
      'Recommendation');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      151, 
      'INT-10052', 
      48, 
      5, 
      438.89, 
      1, 
      'Price Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      152, 
      'INT-10052', 
      40, 
      4, 
      287.82, 
      2, 
      'Availability Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      153, 
      'INT-10052', 
      24, 
      1, 
      496.11, 
      3, 
      'Direct Request');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      154, 
      'INT-10053', 
      45, 
      4, 
      358.02, 
      0, 
      'Comparison');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      155, 
      'INT-10053', 
      39, 
      3, 
      141.63, 
      1, 
      'Recommendation');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      156, 
      'INT-10054', 
      18, 
      5, 
      64.37, 
      0, 
      'Recommendation');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      157, 
      'INT-10054', 
      9, 
      1, 
      357.51, 
      1, 
      'Price Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      158, 
      'INT-10055', 
      43, 
      4, 
      150.19, 
      0, 
      'Inquiry');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      159, 
      'INT-10055', 
      30, 
      1, 
      335.05, 
      1, 
      'Comparison');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      160, 
      'INT-10056', 
      36, 
      3, 
      418.16, 
      0, 
      'Price Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      161, 
      'INT-10057', 
      26, 
      5, 
      70.79, 
      0, 
      'Direct Request');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      162, 
      'INT-10058', 
      10, 
      5, 
      201.8, 
      0, 
      'Comparison');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      163, 
      'INT-10058', 
      50, 
      5, 
      189.06, 
      1, 
      'Direct Request');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      164, 
      'INT-10059', 
      42, 
      3, 
      44.97, 
      0, 
      'Availability Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      165, 
      'INT-10059', 
      37, 
      3, 
      178.33, 
      1, 
      'Price Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      166, 
      'INT-10059', 
      42, 
      5, 
      204.42, 
      2, 
      'Inquiry');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      167, 
      'INT-10060', 
      49, 
      3, 
      256.15, 
      0, 
      'Direct Request');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      168, 
      'INT-10061', 
      15, 
      1, 
      400.34, 
      0, 
      'Direct Request');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      169, 
      'INT-10061', 
      16, 
      3, 
      86.56, 
      1, 
      'Inquiry');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      170, 
      'INT-10062', 
      16, 
      1, 
      192.61, 
      0, 
      'Inquiry');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      171, 
      'INT-10063', 
      43, 
      2, 
      318.85, 
      0, 
      'Comparison');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      172, 
      'INT-10063', 
      45, 
      3, 
      418.57, 
      1, 
      'Recommendation');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      173, 
      'INT-10064', 
      18, 
      1, 
      456.58, 
      0, 
      'Recommendation');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      174, 
      'INT-10065', 
      31, 
      5, 
      248.26, 
      0, 
      'Recommendation');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      175, 
      'INT-10065', 
      37, 
      5, 
      414.29, 
      1, 
      'Comparison');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      176, 
      'INT-10065', 
      8, 
      1, 
      184.06, 
      2, 
      'Inquiry');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      177, 
      'INT-10066', 
      21, 
      4, 
      103.76, 
      0, 
      'Availability Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      178, 
      'INT-10067', 
      9, 
      5, 
      180.4, 
      0, 
      'Comparison');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      179, 
      'INT-10067', 
      10, 
      4, 
      153.42, 
      1, 
      'Price Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      180, 
      'INT-10067', 
      5, 
      5, 
      481.5, 
      2, 
      'Price Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      181, 
      'INT-10068', 
      17, 
      4, 
      19.72, 
      0, 
      'Price Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      182, 
      'INT-10068', 
      7, 
      4, 
      249.33, 
      1, 
      'Direct Request');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      183, 
      'INT-10068', 
      6, 
      2, 
      407.19, 
      2, 
      'Inquiry');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      184, 
      'INT-10068', 
      33, 
      1, 
      67.12, 
      3, 
      'Inquiry');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      185, 
      'INT-10069', 
      34, 
      4, 
      134.82, 
      0, 
      'Availability Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      186, 
      'INT-10069', 
      11, 
      1, 
      44.53, 
      1, 
      'Comparison');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      187, 
      'INT-10069', 
      27, 
      3, 
      191.01, 
      2, 
      'Inquiry');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      188, 
      'INT-10070', 
      39, 
      5, 
      128.23, 
      0, 
      'Inquiry');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      189, 
      'INT-10070', 
      44, 
      4, 
      376.54, 
      1, 
      'Price Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      190, 
      'INT-10071', 
      41, 
      2, 
      330.14, 
      0, 
      'Recommendation');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      191, 
      'INT-10071', 
      33, 
      2, 
      51.74, 
      1, 
      'Price Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      192, 
      'INT-10072', 
      34, 
      4, 
      66.88, 
      0, 
      'Price Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      193, 
      'INT-10073', 
      38, 
      5, 
      424.42, 
      0, 
      'Direct Request');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      194, 
      'INT-10073', 
      25, 
      2, 
      154.74, 
      1, 
      'Comparison');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      195, 
      'INT-10073', 
      5, 
      5, 
      438.61, 
      2, 
      'Inquiry');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      196, 
      'INT-10074', 
      36, 
      5, 
      90.36, 
      0, 
      'Comparison');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      197, 
      'INT-10074', 
      15, 
      1, 
      369.59, 
      1, 
      'Availability Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      198, 
      'INT-10074', 
      14, 
      3, 
      446.68, 
      2, 
      'Recommendation');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      199, 
      'INT-10075', 
      48, 
      3, 
      145.05, 
      0, 
      'Price Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      200, 
      'INT-10076', 
      16, 
      4, 
      369.84, 
      0, 
      'Comparison');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      201, 
      'INT-10077', 
      32, 
      3, 
      267.24, 
      0, 
      'Recommendation');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      202, 
      'INT-10077', 
      46, 
      2, 
      269.85, 
      1, 
      'Recommendation');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      203, 
      'INT-10077', 
      36, 
      5, 
      409.4, 
      2, 
      'Recommendation');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      204, 
      'INT-10077', 
      12, 
      4, 
      491.11, 
      3, 
      'Recommendation');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      205, 
      'INT-10077', 
      10, 
      2, 
      119.61, 
      4, 
      'Comparison');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      206, 
      'INT-10078', 
      48, 
      5, 
      279.78, 
      0, 
      'Availability Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      207, 
      'INT-10078', 
      21, 
      1, 
      285.57, 
      1, 
      'Inquiry');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      208, 
      'INT-10078', 
      14, 
      1, 
      198, 
      2, 
      'Direct Request');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      209, 
      'INT-10079', 
      10, 
      1, 
      177.44, 
      0, 
      'Recommendation');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      210, 
      'INT-10079', 
      32, 
      3, 
      277.47, 
      1, 
      'Comparison');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      211, 
      'INT-10080', 
      44, 
      1, 
      411.7, 
      0, 
      'Availability Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      212, 
      'INT-10080', 
      6, 
      5, 
      207.96, 
      1, 
      'Inquiry');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      213, 
      'INT-10080', 
      12, 
      4, 
      391.13, 
      2, 
      'Inquiry');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      214, 
      'INT-10081', 
      49, 
      1, 
      176.3, 
      0, 
      'Comparison');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      215, 
      'INT-10081', 
      23, 
      2, 
      175.79, 
      1, 
      'Availability Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      216, 
      'INT-10082', 
      16, 
      5, 
      226.16, 
      0, 
      'Inquiry');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      217, 
      'INT-10082', 
      10, 
      2, 
      289, 
      1, 
      'Price Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      218, 
      'INT-10082', 
      22, 
      2, 
      476.75, 
      2, 
      'Direct Request');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      219, 
      'INT-10082', 
      28, 
      1, 
      345.31, 
      3, 
      'Comparison');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      220, 
      'INT-10083', 
      15, 
      3, 
      86.37, 
      0, 
      'Recommendation');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      221, 
      'INT-10084', 
      6, 
      1, 
      21.41, 
      0, 
      'Comparison');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      222, 
      'INT-10084', 
      33, 
      3, 
      54.27, 
      1, 
      'Recommendation');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      223, 
      'INT-10085', 
      50, 
      4, 
      479.2, 
      0, 
      'Direct Request');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      224, 
      'INT-10085', 
      27, 
      3, 
      375.03, 
      1, 
      'Availability Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      225, 
      'INT-10085', 
      39, 
      3, 
      494.63, 
      2, 
      'Direct Request');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      226, 
      'INT-10086', 
      40, 
      3, 
      261.41, 
      0, 
      'Inquiry');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      227, 
      'INT-10086', 
      26, 
      2, 
      310.29, 
      1, 
      'Comparison');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      228, 
      'INT-10087', 
      30, 
      4, 
      158.28, 
      0, 
      'Inquiry');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      229, 
      'INT-10088', 
      38, 
      5, 
      278.27, 
      0, 
      'Price Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      230, 
      'INT-10088', 
      44, 
      5, 
      132.46, 
      1, 
      'Inquiry');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      231, 
      'INT-10088', 
      21, 
      2, 
      53.9, 
      2, 
      'Direct Request');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      232, 
      'INT-10088', 
      13, 
      1, 
      410.39, 
      3, 
      'Inquiry');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      233, 
      'INT-10088', 
      8, 
      4, 
      33.07, 
      4, 
      'Comparison');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      234, 
      'INT-10089', 
      5, 
      4, 
      108, 
      0, 
      'Inquiry');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      235, 
      'INT-10089', 
      50, 
      3, 
      231.36, 
      1, 
      'Price Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      236, 
      'INT-10089', 
      1, 
      4, 
      359.48, 
      2, 
      'Availability Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      237, 
      'INT-10089', 
      34, 
      1, 
      429.4, 
      3, 
      'Availability Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      238, 
      'INT-10089', 
      7, 
      3, 
      475.75, 
      4, 
      'Inquiry');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      239, 
      'INT-10090', 
      46, 
      5, 
      413.99, 
      0, 
      'Price Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      240, 
      'INT-10091', 
      40, 
      3, 
      453.38, 
      0, 
      'Direct Request');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      241, 
      'INT-10091', 
      8, 
      3, 
      464.47, 
      1, 
      'Comparison');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      242, 
      'INT-10091', 
      2, 
      3, 
      180.11, 
      2, 
      'Inquiry');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      243, 
      'INT-10091', 
      33, 
      2, 
      353.69, 
      3, 
      'Direct Request');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      244, 
      'INT-10092', 
      12, 
      5, 
      211.16, 
      0, 
      'Price Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      245, 
      'INT-10092', 
      31, 
      5, 
      291.74, 
      1, 
      'Comparison');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      246, 
      'INT-10092', 
      12, 
      4, 
      239.84, 
      2, 
      'Price Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      247, 
      'INT-10092', 
      49, 
      1, 
      499.59, 
      3, 
      'Availability Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      248, 
      'INT-10093', 
      31, 
      5, 
      53.61, 
      0, 
      'Inquiry');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      249, 
      'INT-10093', 
      9, 
      3, 
      173.15, 
      1, 
      'Recommendation');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      250, 
      'INT-10094', 
      32, 
      1, 
      362.47, 
      0, 
      'Comparison');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      251, 
      'INT-10094', 
      43, 
      5, 
      148.36, 
      1, 
      'Direct Request');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      252, 
      'INT-10094', 
      10, 
      3, 
      445.02, 
      2, 
      'Inquiry');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      253, 
      'INT-10094', 
      11, 
      1, 
      235.86, 
      3, 
      'Direct Request');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      254, 
      'INT-10094', 
      26, 
      2, 
      54.94, 
      4, 
      'Price Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      255, 
      'INT-10095', 
      25, 
      5, 
      300.48, 
      0, 
      'Price Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      256, 
      'INT-10095', 
      7, 
      1, 
      268.97, 
      1, 
      'Inquiry');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      257, 
      'INT-10095', 
      41, 
      4, 
      129.86, 
      2, 
      'Direct Request');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      258, 
      'INT-10095', 
      33, 
      4, 
      341.74, 
      3, 
      'Availability Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      259, 
      'INT-10095', 
      18, 
      4, 
      185.32, 
      4, 
      'Price Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      260, 
      'INT-10096', 
      25, 
      5, 
      476.41, 
      0, 
      'Availability Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      261, 
      'INT-10096', 
      11, 
      3, 
      368.15, 
      1, 
      'Comparison');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      262, 
      'INT-10096', 
      33, 
      1, 
      338.96, 
      2, 
      'Availability Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      263, 
      'INT-10096', 
      11, 
      3, 
      95.16, 
      3, 
      'Price Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      264, 
      'INT-10097', 
      9, 
      1, 
      198.36, 
      0, 
      'Availability Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      265, 
      'INT-10097', 
      49, 
      1, 
      443.75, 
      1, 
      'Recommendation');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      266, 
      'INT-10097', 
      29, 
      5, 
      346.09, 
      2, 
      'Price Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      267, 
      'INT-10097', 
      3, 
      3, 
      133.62, 
      3, 
      'Inquiry');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      268, 
      'INT-10097', 
      19, 
      5, 
      272.57, 
      4, 
      'Comparison');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      269, 
      'INT-10098', 
      19, 
      5, 
      99.55, 
      0, 
      'Inquiry');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      270, 
      'INT-10098', 
      42, 
      2, 
      313.46, 
      1, 
      'Comparison');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      271, 
      'INT-10098', 
      46, 
      4, 
      54.12, 
      2, 
      'Inquiry');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      272, 
      'INT-10099', 
      17, 
      4, 
      405.07, 
      0, 
      'Recommendation');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      273, 
      'INT-10100', 
      48, 
      1, 
      368.79, 
      0, 
      'Direct Request');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      274, 
      'INT-10100', 
      5, 
      2, 
      35.31, 
      1, 
      'Availability Check');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      275, 
      'INT-10100', 
      29, 
      3, 
      237.7, 
      2, 
      'Inquiry');
INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      276, 
      'INT-10100', 
      46, 
      3, 
      486.75, 
      3, 
      'Recommendation');

SET IDENTITY_INSERT dbo.TransactionItems OFF;
GO

DELETE FROM dbo.bronze_device_logs;
GO

SET IDENTITY_INSERT dbo.bronze_device_logs ON;
GO

INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      1, 
      'DEVICE-1005', 
      1, 
      '2025-02-26 15:02:06', 
      'Connection', 
      N'{"status":"success","details":"Event details for log 1","value":96}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      2, 
      'DEVICE-1003', 
      14, 
      '2025-01-11 05:43:50', 
      'Disconnection', 
      N'{"status":"success","details":"Event details for log 2","value":79}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      3, 
      'DEVICE-1001', 
      8, 
      '2025-03-12 07:58:11', 
      'Disconnection', 
      N'{"status":"success","details":"Event details for log 3","value":53}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      4, 
      'DEVICE-1003', 
      8, 
      '2025-02-26 23:23:14', 
      'Status', 
      N'{"status":"success","details":"Event details for log 4","value":72}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      5, 
      'DEVICE-1003', 
      4, 
      '2025-01-18 03:59:50', 
      'Startup', 
      N'{"status":"success","details":"Event details for log 5","value":24}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      6, 
      'DEVICE-1008', 
      4, 
      '2025-01-06 21:43:57', 
      'Startup', 
      N'{"status":"success","details":"Event details for log 6","value":16}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      7, 
      'DEVICE-1004', 
      15, 
      '2025-04-04 18:26:04', 
      'Startup', 
      N'{"status":"success","details":"Event details for log 7","value":2}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      8, 
      'DEVICE-1000', 
      2, 
      '2025-01-04 11:26:08', 
      'Heartbeat', 
      N'{"status":"success","details":"Event details for log 8","value":38}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      9, 
      'DEVICE-1006', 
      14, 
      '2025-01-09 06:26:49', 
      'Status', 
      N'{"status":"success","details":"Event details for log 9","value":96}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      10, 
      'DEVICE-1001', 
      11, 
      '2025-01-21 09:54:45', 
      'Warning', 
      N'{"status":"success","details":"Event details for log 10","value":68}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      11, 
      'DEVICE-1006', 
      8, 
      '2025-03-28 07:59:45', 
      'Startup', 
      N'{"status":"success","details":"Event details for log 11","value":2}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      12, 
      'DEVICE-1005', 
      2, 
      '2025-01-13 10:03:05', 
      'Error', 
      N'{"status":"success","details":"Event details for log 12","value":35}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      13, 
      'DEVICE-1003', 
      10, 
      '2025-04-06 10:12:04', 
      'Warning', 
      N'{"status":"success","details":"Event details for log 13","value":72}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      14, 
      'DEVICE-1002', 
      3, 
      '2025-02-27 05:25:23', 
      'Disconnection', 
      N'{"status":"error","details":"Event details for log 14","value":65}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      15, 
      'DEVICE-1009', 
      10, 
      '2025-05-10 19:42:49', 
      'Shutdown', 
      N'{"status":"error","details":"Event details for log 15","value":8}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      16, 
      'DEVICE-1008', 
      12, 
      '2025-04-30 19:48:20', 
      'Connection', 
      N'{"status":"success","details":"Event details for log 16","value":86}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      17, 
      'DEVICE-1002', 
      13, 
      '2025-02-03 00:25:49', 
      'Status', 
      N'{"status":"success","details":"Event details for log 17","value":46}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      18, 
      'DEVICE-1004', 
      2, 
      '2025-02-17 20:01:36', 
      'Warning', 
      N'{"status":"success","details":"Event details for log 18","value":74}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      19, 
      'DEVICE-1003', 
      6, 
      '2025-01-21 01:17:34', 
      'Disconnection', 
      N'{"status":"error","details":"Event details for log 19","value":25}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      20, 
      'DEVICE-1005', 
      1, 
      '2025-04-25 16:47:03', 
      'Warning', 
      N'{"status":"error","details":"Event details for log 20","value":55}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      21, 
      'DEVICE-1004', 
      12, 
      '2025-04-24 19:21:48', 
      'Connection', 
      N'{"status":"success","details":"Event details for log 21","value":55}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      22, 
      'DEVICE-1009', 
      14, 
      '2025-02-24 17:43:10', 
      'Connection', 
      N'{"status":"success","details":"Event details for log 22","value":14}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      23, 
      'DEVICE-1003', 
      15, 
      '2025-02-01 08:09:19', 
      'Warning', 
      N'{"status":"error","details":"Event details for log 23","value":15}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      24, 
      'DEVICE-1009', 
      1, 
      '2025-03-20 09:20:44', 
      'Connection', 
      N'{"status":"success","details":"Event details for log 24","value":60}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      25, 
      'DEVICE-1009', 
      11, 
      '2025-03-21 04:44:14', 
      'Heartbeat', 
      N'{"status":"success","details":"Event details for log 25","value":54}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      26, 
      'DEVICE-1009', 
      1, 
      '2025-01-09 16:10:59', 
      'Error', 
      N'{"status":"success","details":"Event details for log 26","value":51}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      27, 
      'DEVICE-1006', 
      3, 
      '2025-03-03 09:19:38', 
      'Warning', 
      N'{"status":"success","details":"Event details for log 27","value":0}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      28, 
      'DEVICE-1008', 
      5, 
      '2025-03-21 15:21:49', 
      'Shutdown', 
      N'{"status":"success","details":"Event details for log 28","value":50}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      29, 
      'DEVICE-1009', 
      3, 
      '2025-02-16 17:30:35', 
      'Status', 
      N'{"status":"error","details":"Event details for log 29","value":84}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      30, 
      'DEVICE-1007', 
      7, 
      '2025-03-09 15:27:14', 
      'Startup', 
      N'{"status":"error","details":"Event details for log 30","value":65}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      31, 
      'DEVICE-1004', 
      9, 
      '2025-05-17 22:04:36', 
      'Startup', 
      N'{"status":"success","details":"Event details for log 31","value":41}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      32, 
      'DEVICE-1008', 
      10, 
      '2025-04-18 12:32:20', 
      'Disconnection', 
      N'{"status":"success","details":"Event details for log 32","value":62}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      33, 
      'DEVICE-1003', 
      2, 
      '2025-01-24 09:46:29', 
      'Connection', 
      N'{"status":"success","details":"Event details for log 33","value":13}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      34, 
      'DEVICE-1008', 
      6, 
      '2025-03-03 00:19:12', 
      'Heartbeat', 
      N'{"status":"success","details":"Event details for log 34","value":39}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      35, 
      'DEVICE-1004', 
      14, 
      '2025-02-03 12:26:42', 
      'Startup', 
      N'{"status":"success","details":"Event details for log 35","value":64}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      36, 
      'DEVICE-1005', 
      1, 
      '2025-02-22 01:30:19', 
      'Warning', 
      N'{"status":"success","details":"Event details for log 36","value":57}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      37, 
      'DEVICE-1004', 
      7, 
      '2025-03-06 10:36:08', 
      'Connection', 
      N'{"status":"success","details":"Event details for log 37","value":56}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      38, 
      'DEVICE-1007', 
      12, 
      '2025-01-26 10:36:59', 
      'Shutdown', 
      N'{"status":"error","details":"Event details for log 38","value":92}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      39, 
      'DEVICE-1004', 
      7, 
      '2025-01-16 05:48:13', 
      'Error', 
      N'{"status":"success","details":"Event details for log 39","value":80}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      40, 
      'DEVICE-1006', 
      2, 
      '2025-04-04 17:55:11', 
      'Startup', 
      N'{"status":"success","details":"Event details for log 40","value":41}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      41, 
      'DEVICE-1005', 
      4, 
      '2025-04-26 10:34:49', 
      'Startup', 
      N'{"status":"success","details":"Event details for log 41","value":63}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      42, 
      'DEVICE-1003', 
      9, 
      '2025-03-13 09:34:03', 
      'Disconnection', 
      N'{"status":"error","details":"Event details for log 42","value":32}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      43, 
      'DEVICE-1000', 
      4, 
      '2025-04-13 20:31:44', 
      'Startup', 
      N'{"status":"error","details":"Event details for log 43","value":51}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      44, 
      'DEVICE-1007', 
      11, 
      '2025-01-28 17:27:50', 
      'Startup', 
      N'{"status":"success","details":"Event details for log 44","value":57}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      45, 
      'DEVICE-1005', 
      2, 
      '2025-02-08 22:27:15', 
      'Disconnection', 
      N'{"status":"success","details":"Event details for log 45","value":55}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      46, 
      'DEVICE-1009', 
      7, 
      '2025-02-11 16:06:47', 
      'Shutdown', 
      N'{"status":"error","details":"Event details for log 46","value":7}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      47, 
      'DEVICE-1002', 
      7, 
      '2025-02-26 08:43:26', 
      'Shutdown', 
      N'{"status":"success","details":"Event details for log 47","value":51}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      48, 
      'DEVICE-1004', 
      7, 
      '2025-02-21 04:49:03', 
      'Heartbeat', 
      N'{"status":"success","details":"Event details for log 48","value":89}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      49, 
      'DEVICE-1001', 
      12, 
      '2025-05-06 07:27:05', 
      'Error', 
      N'{"status":"success","details":"Event details for log 49","value":64}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      50, 
      'DEVICE-1000', 
      4, 
      '2025-03-09 05:37:24', 
      'Error', 
      N'{"status":"success","details":"Event details for log 50","value":84}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      51, 
      'DEVICE-1008', 
      9, 
      '2025-04-21 08:58:17', 
      'Heartbeat', 
      N'{"status":"success","details":"Event details for log 51","value":20}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      52, 
      'DEVICE-1007', 
      3, 
      '2025-03-31 00:30:47', 
      'Shutdown', 
      N'{"status":"error","details":"Event details for log 52","value":2}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      53, 
      'DEVICE-1002', 
      3, 
      '2025-04-19 15:02:17', 
      'Startup', 
      N'{"status":"error","details":"Event details for log 53","value":15}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      54, 
      'DEVICE-1001', 
      14, 
      '2025-01-15 22:36:40', 
      'Error', 
      N'{"status":"success","details":"Event details for log 54","value":31}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      55, 
      'DEVICE-1000', 
      12, 
      '2025-01-18 21:35:45', 
      'Disconnection', 
      N'{"status":"success","details":"Event details for log 55","value":64}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      56, 
      'DEVICE-1003', 
      14, 
      '2025-04-11 23:53:44', 
      'Error', 
      N'{"status":"success","details":"Event details for log 56","value":98}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      57, 
      'DEVICE-1008', 
      11, 
      '2025-02-07 05:16:22', 
      'Shutdown', 
      N'{"status":"success","details":"Event details for log 57","value":92}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      58, 
      'DEVICE-1008', 
      5, 
      '2025-05-17 17:51:04', 
      'Heartbeat', 
      N'{"status":"success","details":"Event details for log 58","value":76}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      59, 
      'DEVICE-1007', 
      8, 
      '2025-04-28 23:48:06', 
      'Startup', 
      N'{"status":"success","details":"Event details for log 59","value":47}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      60, 
      'DEVICE-1001', 
      5, 
      '2025-04-23 16:14:01', 
      'Status', 
      N'{"status":"success","details":"Event details for log 60","value":21}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      61, 
      'DEVICE-1007', 
      3, 
      '2025-03-05 11:40:19', 
      'Connection', 
      N'{"status":"success","details":"Event details for log 61","value":1}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      62, 
      'DEVICE-1009', 
      12, 
      '2025-01-04 21:28:53', 
      'Startup', 
      N'{"status":"success","details":"Event details for log 62","value":33}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      63, 
      'DEVICE-1009', 
      1, 
      '2025-04-05 09:27:16', 
      'Warning', 
      N'{"status":"success","details":"Event details for log 63","value":79}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      64, 
      'DEVICE-1001', 
      10, 
      '2025-02-26 19:43:50', 
      'Connection', 
      N'{"status":"error","details":"Event details for log 64","value":15}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      65, 
      'DEVICE-1008', 
      10, 
      '2025-02-21 14:20:08', 
      'Disconnection', 
      N'{"status":"error","details":"Event details for log 65","value":67}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      66, 
      'DEVICE-1005', 
      7, 
      '2025-01-17 03:26:41', 
      'Warning', 
      N'{"status":"error","details":"Event details for log 66","value":61}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      67, 
      'DEVICE-1000', 
      10, 
      '2025-01-13 11:12:51', 
      'Warning', 
      N'{"status":"error","details":"Event details for log 67","value":83}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      68, 
      'DEVICE-1006', 
      13, 
      '2025-04-23 00:47:05', 
      'Shutdown', 
      N'{"status":"success","details":"Event details for log 68","value":75}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      69, 
      'DEVICE-1001', 
      6, 
      '2025-01-26 18:21:56', 
      'Startup', 
      N'{"status":"success","details":"Event details for log 69","value":58}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      70, 
      'DEVICE-1009', 
      7, 
      '2025-01-04 06:50:04', 
      'Startup', 
      N'{"status":"success","details":"Event details for log 70","value":76}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      71, 
      'DEVICE-1007', 
      6, 
      '2025-03-24 08:21:43', 
      'Disconnection', 
      N'{"status":"success","details":"Event details for log 71","value":21}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      72, 
      'DEVICE-1002', 
      15, 
      '2025-01-30 11:55:40', 
      'Startup', 
      N'{"status":"success","details":"Event details for log 72","value":17}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      73, 
      'DEVICE-1001', 
      8, 
      '2025-03-11 03:21:27', 
      'Warning', 
      N'{"status":"error","details":"Event details for log 73","value":71}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      74, 
      'DEVICE-1009', 
      5, 
      '2025-05-04 01:58:09', 
      'Error', 
      N'{"status":"success","details":"Event details for log 74","value":1}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      75, 
      'DEVICE-1009', 
      5, 
      '2025-03-17 20:16:40', 
      'Connection', 
      N'{"status":"success","details":"Event details for log 75","value":83}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      76, 
      'DEVICE-1000', 
      11, 
      '2025-02-05 06:31:37', 
      'Connection', 
      N'{"status":"success","details":"Event details for log 76","value":14}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      77, 
      'DEVICE-1000', 
      3, 
      '2025-04-15 22:37:03', 
      'Connection', 
      N'{"status":"success","details":"Event details for log 77","value":59}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      78, 
      'DEVICE-1003', 
      12, 
      '2025-01-12 22:37:08', 
      'Error', 
      N'{"status":"error","details":"Event details for log 78","value":4}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      79, 
      'DEVICE-1007', 
      14, 
      '2025-01-31 02:27:04', 
      'Warning', 
      N'{"status":"error","details":"Event details for log 79","value":7}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      80, 
      'DEVICE-1004', 
      12, 
      '2025-02-20 15:52:55', 
      'Startup', 
      N'{"status":"success","details":"Event details for log 80","value":97}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      81, 
      'DEVICE-1005', 
      8, 
      '2025-03-26 06:09:12', 
      'Error', 
      N'{"status":"success","details":"Event details for log 81","value":26}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      82, 
      'DEVICE-1009', 
      3, 
      '2025-05-16 05:03:37', 
      'Shutdown', 
      N'{"status":"success","details":"Event details for log 82","value":73}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      83, 
      'DEVICE-1005', 
      10, 
      '2025-01-31 11:54:16', 
      'Shutdown', 
      N'{"status":"error","details":"Event details for log 83","value":100}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      84, 
      'DEVICE-1008', 
      12, 
      '2025-03-30 18:51:17', 
      'Status', 
      N'{"status":"error","details":"Event details for log 84","value":66}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      85, 
      'DEVICE-1003', 
      9, 
      '2025-03-30 07:29:14', 
      'Error', 
      N'{"status":"success","details":"Event details for log 85","value":94}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      86, 
      'DEVICE-1009', 
      11, 
      '2025-03-27 11:36:32', 
      'Startup', 
      N'{"status":"success","details":"Event details for log 86","value":44}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      87, 
      'DEVICE-1000', 
      12, 
      '2025-05-02 21:22:30', 
      'Warning', 
      N'{"status":"error","details":"Event details for log 87","value":15}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      88, 
      'DEVICE-1007', 
      6, 
      '2025-03-01 06:02:04', 
      'Warning', 
      N'{"status":"success","details":"Event details for log 88","value":93}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      89, 
      'DEVICE-1001', 
      15, 
      '2025-04-27 13:18:15', 
      'Shutdown', 
      N'{"status":"success","details":"Event details for log 89","value":43}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      90, 
      'DEVICE-1003', 
      5, 
      '2025-03-02 19:12:04', 
      'Startup', 
      N'{"status":"success","details":"Event details for log 90","value":68}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      91, 
      'DEVICE-1000', 
      13, 
      '2025-03-15 14:18:14', 
      'Startup', 
      N'{"status":"success","details":"Event details for log 91","value":29}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      92, 
      'DEVICE-1000', 
      1, 
      '2025-03-16 17:03:19', 
      'Error', 
      N'{"status":"success","details":"Event details for log 92","value":58}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      93, 
      'DEVICE-1002', 
      15, 
      '2025-05-16 13:09:50', 
      'Connection', 
      N'{"status":"success","details":"Event details for log 93","value":28}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      94, 
      'DEVICE-1005', 
      14, 
      '2025-01-19 23:49:04', 
      'Shutdown', 
      N'{"status":"success","details":"Event details for log 94","value":52}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      95, 
      'DEVICE-1004', 
      15, 
      '2025-01-14 16:32:50', 
      'Disconnection', 
      N'{"status":"success","details":"Event details for log 95","value":47}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      96, 
      'DEVICE-1006', 
      7, 
      '2025-03-10 13:31:31', 
      'Disconnection', 
      N'{"status":"success","details":"Event details for log 96","value":57}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      97, 
      'DEVICE-1007', 
      2, 
      '2025-01-01 13:04:31', 
      'Heartbeat', 
      N'{"status":"success","details":"Event details for log 97","value":86}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      98, 
      'DEVICE-1005', 
      8, 
      '2025-01-27 02:45:42', 
      'Disconnection', 
      N'{"status":"success","details":"Event details for log 98","value":36}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      99, 
      'DEVICE-1005', 
      15, 
      '2025-04-07 05:41:09', 
      'Error', 
      N'{"status":"success","details":"Event details for log 99","value":79}');
INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      100, 
      'DEVICE-1000', 
      3, 
      '2025-02-28 16:43:49', 
      'Disconnection', 
      N'{"status":"error","details":"Event details for log 100","value":39}');

SET IDENTITY_INSERT dbo.bronze_device_logs OFF;
GO

DELETE FROM dbo.bronze_vision_detections;
GO

SET IDENTITY_INSERT dbo.bronze_vision_detections ON;
GO

INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      1, 
      7, 
      'DEVICE-1002', 
      '2025-04-11 21:57:40', 
      N'Display', 
      0.5019, 
      N'https://storage.example.com/images/detection-1.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      2, 
      11, 
      'DEVICE-1005', 
      '2025-01-16 20:20:31', 
      N'Cash Register', 
      0.9507, 
      N'https://storage.example.com/images/detection-2.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      3, 
      12, 
      'DEVICE-1003', 
      '2025-03-19 11:04:35', 
      N'Display', 
      0.9485, 
      N'https://storage.example.com/images/detection-3.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      4, 
      15, 
      'DEVICE-1007', 
      '2025-01-25 14:38:52', 
      N'Person', 
      0.8708, 
      N'https://storage.example.com/images/detection-4.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      5, 
      13, 
      'DEVICE-1001', 
      '2025-03-09 23:43:35', 
      N'Basket', 
      0.5071, 
      N'https://storage.example.com/images/detection-5.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      6, 
      10, 
      'DEVICE-1008', 
      '2025-01-13 21:27:04', 
      N'Shelf', 
      0.7807, 
      N'https://storage.example.com/images/detection-6.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      7, 
      4, 
      'DEVICE-1007', 
      '2025-01-13 13:18:39', 
      N'Window', 
      0.6758, 
      N'https://storage.example.com/images/detection-7.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      8, 
      15, 
      'DEVICE-1002', 
      '2025-02-25 10:43:58', 
      N'Product', 
      0.6136, 
      N'https://storage.example.com/images/detection-8.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      9, 
      2, 
      'DEVICE-1001', 
      '2025-04-05 01:47:55', 
      N'Door', 
      0.6916, 
      N'https://storage.example.com/images/detection-9.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      10, 
      12, 
      'DEVICE-1006', 
      '2025-05-15 07:53:04', 
      N'Shelf', 
      0.6349, 
      N'https://storage.example.com/images/detection-10.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      11, 
      14, 
      'DEVICE-1003', 
      '2025-04-20 06:45:34', 
      N'Basket', 
      0.5224, 
      N'https://storage.example.com/images/detection-11.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      12, 
      7, 
      'DEVICE-1000', 
      '2025-03-14 15:32:36', 
      N'Person', 
      0.6699, 
      N'https://storage.example.com/images/detection-12.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      13, 
      3, 
      'DEVICE-1008', 
      '2025-04-27 00:07:25', 
      N'Cash Register', 
      0.826, 
      N'https://storage.example.com/images/detection-13.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      14, 
      11, 
      'DEVICE-1002', 
      '2025-05-15 22:32:12', 
      N'Basket', 
      0.8786, 
      N'https://storage.example.com/images/detection-14.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      15, 
      11, 
      'DEVICE-1001', 
      '2025-04-20 08:33:16', 
      N'Shelf', 
      0.5387, 
      N'https://storage.example.com/images/detection-15.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      16, 
      1, 
      'DEVICE-1000', 
      '2025-03-05 17:38:27', 
      N'Cash Register', 
      0.6891, 
      N'https://storage.example.com/images/detection-16.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      17, 
      10, 
      'DEVICE-1000', 
      '2025-01-09 16:12:31', 
      N'Door', 
      0.8999, 
      N'https://storage.example.com/images/detection-17.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      18, 
      3, 
      'DEVICE-1000', 
      '2025-02-16 23:19:58', 
      N'Cart', 
      0.9092, 
      N'https://storage.example.com/images/detection-18.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      19, 
      14, 
      'DEVICE-1003', 
      '2025-03-19 18:00:11', 
      N'Door', 
      0.5701, 
      N'https://storage.example.com/images/detection-19.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      20, 
      15, 
      'DEVICE-1006', 
      '2025-02-13 04:26:52', 
      N'Window', 
      0.6458, 
      N'https://storage.example.com/images/detection-20.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      21, 
      7, 
      'DEVICE-1007', 
      '2025-02-17 04:22:52', 
      N'Cart', 
      0.6199, 
      N'https://storage.example.com/images/detection-21.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      22, 
      8, 
      'DEVICE-1003', 
      '2025-01-16 17:19:55', 
      N'Door', 
      0.5902, 
      N'https://storage.example.com/images/detection-22.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      23, 
      13, 
      'DEVICE-1005', 
      '2025-02-11 14:07:28', 
      N'Cash Register', 
      0.5833, 
      N'https://storage.example.com/images/detection-23.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      24, 
      14, 
      'DEVICE-1008', 
      '2025-03-04 23:00:15', 
      N'Display', 
      0.6561, 
      N'https://storage.example.com/images/detection-24.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      25, 
      13, 
      'DEVICE-1008', 
      '2025-03-22 12:02:34', 
      N'Window', 
      0.5295, 
      N'https://storage.example.com/images/detection-25.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      26, 
      10, 
      'DEVICE-1001', 
      '2025-01-14 02:54:52', 
      N'Cash Register', 
      0.8523, 
      N'https://storage.example.com/images/detection-26.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      27, 
      14, 
      'DEVICE-1007', 
      '2025-03-28 01:14:33', 
      N'Cash Register', 
      0.6177, 
      N'https://storage.example.com/images/detection-27.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      28, 
      6, 
      'DEVICE-1000', 
      '2025-02-27 08:11:23', 
      N'Door', 
      0.7867, 
      N'https://storage.example.com/images/detection-28.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      29, 
      12, 
      'DEVICE-1000', 
      '2025-04-08 16:45:25', 
      N'Cash Register', 
      0.7632, 
      N'https://storage.example.com/images/detection-29.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      30, 
      13, 
      'DEVICE-1000', 
      '2025-02-14 10:44:29', 
      N'Display', 
      0.7747, 
      N'https://storage.example.com/images/detection-30.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      31, 
      7, 
      'DEVICE-1008', 
      '2025-03-26 10:51:00', 
      N'Cash Register', 
      0.6946, 
      N'https://storage.example.com/images/detection-31.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      32, 
      9, 
      'DEVICE-1004', 
      '2025-03-15 06:41:38', 
      N'Cart', 
      0.8232, 
      N'https://storage.example.com/images/detection-32.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      33, 
      1, 
      'DEVICE-1002', 
      '2025-03-02 02:18:47', 
      N'Door', 
      0.6785, 
      N'https://storage.example.com/images/detection-33.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      34, 
      2, 
      'DEVICE-1006', 
      '2025-03-02 09:40:06', 
      N'Person', 
      0.8408, 
      N'https://storage.example.com/images/detection-34.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      35, 
      2, 
      'DEVICE-1006', 
      '2025-02-28 11:30:31', 
      N'Person', 
      0.8294, 
      N'https://storage.example.com/images/detection-35.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      36, 
      1, 
      'DEVICE-1003', 
      '2025-03-23 04:32:39', 
      N'Product', 
      0.531, 
      N'https://storage.example.com/images/detection-36.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      37, 
      13, 
      'DEVICE-1007', 
      '2025-02-05 03:05:26', 
      N'Shelf', 
      0.52, 
      N'https://storage.example.com/images/detection-37.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      38, 
      12, 
      'DEVICE-1006', 
      '2025-02-10 14:35:32', 
      N'Basket', 
      0.8366, 
      N'https://storage.example.com/images/detection-38.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      39, 
      12, 
      'DEVICE-1002', 
      '2025-01-13 08:00:06', 
      N'Door', 
      0.9987, 
      N'https://storage.example.com/images/detection-39.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      40, 
      5, 
      'DEVICE-1005', 
      '2025-02-10 20:14:15', 
      N'Person', 
      0.6346, 
      N'https://storage.example.com/images/detection-40.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      41, 
      12, 
      'DEVICE-1009', 
      '2025-04-18 01:00:16', 
      N'Door', 
      0.5984, 
      N'https://storage.example.com/images/detection-41.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      42, 
      12, 
      'DEVICE-1005', 
      '2025-05-03 01:53:57', 
      N'Door', 
      0.9395, 
      N'https://storage.example.com/images/detection-42.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      43, 
      10, 
      'DEVICE-1004', 
      '2025-01-07 06:39:58', 
      N'Product', 
      0.6598, 
      N'https://storage.example.com/images/detection-43.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      44, 
      10, 
      'DEVICE-1007', 
      '2025-01-01 21:35:12', 
      N'Basket', 
      0.7083, 
      N'https://storage.example.com/images/detection-44.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      45, 
      14, 
      'DEVICE-1005', 
      '2025-01-06 18:53:51', 
      N'Basket', 
      0.5794, 
      N'https://storage.example.com/images/detection-45.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      46, 
      13, 
      'DEVICE-1006', 
      '2025-01-18 17:50:55', 
      N'Shelf', 
      0.7188, 
      N'https://storage.example.com/images/detection-46.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      47, 
      10, 
      'DEVICE-1004', 
      '2025-05-09 09:12:43', 
      N'Basket', 
      0.603, 
      N'https://storage.example.com/images/detection-47.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      48, 
      9, 
      'DEVICE-1008', 
      '2025-04-02 14:39:45', 
      N'Display', 
      0.7446, 
      N'https://storage.example.com/images/detection-48.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      49, 
      15, 
      'DEVICE-1008', 
      '2025-01-13 01:25:27', 
      N'Shelf', 
      0.5068, 
      N'https://storage.example.com/images/detection-49.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      50, 
      9, 
      'DEVICE-1002', 
      '2025-01-07 01:44:39', 
      N'Person', 
      0.7583, 
      N'https://storage.example.com/images/detection-50.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      51, 
      15, 
      'DEVICE-1005', 
      '2025-02-20 00:09:44', 
      N'Shelf', 
      0.9468, 
      N'https://storage.example.com/images/detection-51.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      52, 
      15, 
      'DEVICE-1004', 
      '2025-01-17 22:21:55', 
      N'Shelf', 
      0.5908, 
      N'https://storage.example.com/images/detection-52.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      53, 
      7, 
      'DEVICE-1004', 
      '2025-04-19 04:18:36', 
      N'Basket', 
      0.8156, 
      N'https://storage.example.com/images/detection-53.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      54, 
      8, 
      'DEVICE-1008', 
      '2025-02-03 18:47:58', 
      N'Door', 
      0.5585, 
      N'https://storage.example.com/images/detection-54.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      55, 
      5, 
      'DEVICE-1002', 
      '2025-03-23 15:22:06', 
      N'Shelf', 
      0.867, 
      N'https://storage.example.com/images/detection-55.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      56, 
      1, 
      'DEVICE-1000', 
      '2025-04-07 06:26:25', 
      N'Product', 
      0.6338, 
      N'https://storage.example.com/images/detection-56.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      57, 
      7, 
      'DEVICE-1009', 
      '2025-01-01 02:21:11', 
      N'Display', 
      0.7795, 
      N'https://storage.example.com/images/detection-57.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      58, 
      11, 
      'DEVICE-1007', 
      '2025-02-23 00:25:46', 
      N'Door', 
      0.5021, 
      N'https://storage.example.com/images/detection-58.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      59, 
      6, 
      'DEVICE-1008', 
      '2025-02-23 16:57:39', 
      N'Basket', 
      0.624, 
      N'https://storage.example.com/images/detection-59.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      60, 
      6, 
      'DEVICE-1005', 
      '2025-01-25 19:57:33', 
      N'Basket', 
      0.6841, 
      N'https://storage.example.com/images/detection-60.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      61, 
      10, 
      'DEVICE-1007', 
      '2025-04-29 13:25:50', 
      N'Cart', 
      0.6578, 
      N'https://storage.example.com/images/detection-61.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      62, 
      12, 
      'DEVICE-1007', 
      '2025-02-02 21:39:30', 
      N'Shelf', 
      0.5194, 
      N'https://storage.example.com/images/detection-62.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      63, 
      14, 
      'DEVICE-1005', 
      '2025-01-02 04:39:58', 
      N'Display', 
      0.666, 
      N'https://storage.example.com/images/detection-63.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      64, 
      8, 
      'DEVICE-1009', 
      '2025-02-04 05:59:02', 
      N'Person', 
      0.6615, 
      N'https://storage.example.com/images/detection-64.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      65, 
      11, 
      'DEVICE-1009', 
      '2025-01-23 00:54:28', 
      N'Display', 
      0.6217, 
      N'https://storage.example.com/images/detection-65.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      66, 
      7, 
      'DEVICE-1004', 
      '2025-04-29 08:54:23', 
      N'Basket', 
      0.5709, 
      N'https://storage.example.com/images/detection-66.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      67, 
      6, 
      'DEVICE-1001', 
      '2025-05-16 23:37:20', 
      N'Window', 
      0.5799, 
      N'https://storage.example.com/images/detection-67.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      68, 
      1, 
      'DEVICE-1006', 
      '2025-04-01 20:12:56', 
      N'Basket', 
      0.797, 
      N'https://storage.example.com/images/detection-68.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      69, 
      5, 
      'DEVICE-1002', 
      '2025-03-25 07:13:08', 
      N'Product', 
      0.8076, 
      N'https://storage.example.com/images/detection-69.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      70, 
      9, 
      'DEVICE-1000', 
      '2025-02-03 03:33:13', 
      N'Shelf', 
      0.5172, 
      N'https://storage.example.com/images/detection-70.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      71, 
      6, 
      'DEVICE-1009', 
      '2025-02-23 06:02:09', 
      N'Window', 
      0.7185, 
      N'https://storage.example.com/images/detection-71.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      72, 
      13, 
      'DEVICE-1002', 
      '2025-01-25 06:13:18', 
      N'Person', 
      0.6326, 
      N'https://storage.example.com/images/detection-72.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      73, 
      4, 
      'DEVICE-1009', 
      '2025-02-04 10:54:44', 
      N'Display', 
      0.7012, 
      N'https://storage.example.com/images/detection-73.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      74, 
      7, 
      'DEVICE-1006', 
      '2025-03-11 00:50:00', 
      N'Window', 
      0.5408, 
      N'https://storage.example.com/images/detection-74.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      75, 
      11, 
      'DEVICE-1009', 
      '2025-01-13 13:07:43', 
      N'Cart', 
      0.8288, 
      N'https://storage.example.com/images/detection-75.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      76, 
      2, 
      'DEVICE-1004', 
      '2025-02-02 08:40:47', 
      N'Basket', 
      0.9243, 
      N'https://storage.example.com/images/detection-76.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      77, 
      7, 
      'DEVICE-1008', 
      '2025-04-05 00:04:54', 
      N'Display', 
      0.632, 
      N'https://storage.example.com/images/detection-77.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      78, 
      5, 
      'DEVICE-1001', 
      '2025-05-19 09:04:22', 
      N'Window', 
      0.6066, 
      N'https://storage.example.com/images/detection-78.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      79, 
      7, 
      'DEVICE-1004', 
      '2025-04-01 07:45:37', 
      N'Door', 
      0.8982, 
      N'https://storage.example.com/images/detection-79.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      80, 
      14, 
      'DEVICE-1003', 
      '2025-02-11 13:06:48', 
      N'Shelf', 
      0.5548, 
      N'https://storage.example.com/images/detection-80.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      81, 
      9, 
      'DEVICE-1005', 
      '2025-03-24 08:31:04', 
      N'Basket', 
      0.7307, 
      N'https://storage.example.com/images/detection-81.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      82, 
      8, 
      'DEVICE-1003', 
      '2025-02-19 21:24:15', 
      N'Person', 
      0.7099, 
      N'https://storage.example.com/images/detection-82.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      83, 
      9, 
      'DEVICE-1001', 
      '2025-01-11 21:50:24', 
      N'Cart', 
      0.5101, 
      N'https://storage.example.com/images/detection-83.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      84, 
      3, 
      'DEVICE-1007', 
      '2025-01-21 05:22:20', 
      N'Cart', 
      0.565, 
      N'https://storage.example.com/images/detection-84.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      85, 
      15, 
      'DEVICE-1007', 
      '2025-02-20 20:08:00', 
      N'Cart', 
      0.9147, 
      N'https://storage.example.com/images/detection-85.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      86, 
      1, 
      'DEVICE-1006', 
      '2025-01-27 01:22:05', 
      N'Basket', 
      0.9718, 
      N'https://storage.example.com/images/detection-86.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      87, 
      12, 
      'DEVICE-1004', 
      '2025-04-11 12:19:22', 
      N'Cart', 
      0.9937, 
      N'https://storage.example.com/images/detection-87.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      88, 
      4, 
      'DEVICE-1002', 
      '2025-05-16 06:50:03', 
      N'Basket', 
      0.5131, 
      N'https://storage.example.com/images/detection-88.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      89, 
      5, 
      'DEVICE-1004', 
      '2025-01-02 11:52:34', 
      N'Display', 
      0.5856, 
      N'https://storage.example.com/images/detection-89.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      90, 
      13, 
      'DEVICE-1009', 
      '2025-01-08 07:35:53', 
      N'Cash Register', 
      0.5222, 
      N'https://storage.example.com/images/detection-90.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      91, 
      9, 
      'DEVICE-1009', 
      '2025-03-03 07:47:02', 
      N'Person', 
      0.6067, 
      N'https://storage.example.com/images/detection-91.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      92, 
      13, 
      'DEVICE-1009', 
      '2025-04-01 00:44:12', 
      N'Shelf', 
      0.8058, 
      N'https://storage.example.com/images/detection-92.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      93, 
      14, 
      'DEVICE-1004', 
      '2025-03-24 05:33:34', 
      N'Cash Register', 
      0.7876, 
      N'https://storage.example.com/images/detection-93.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      94, 
      15, 
      'DEVICE-1008', 
      '2025-04-11 19:05:47', 
      N'Person', 
      0.8538, 
      N'https://storage.example.com/images/detection-94.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      95, 
      2, 
      'DEVICE-1007', 
      '2025-02-16 18:49:25', 
      N'Cart', 
      0.9584, 
      N'https://storage.example.com/images/detection-95.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      96, 
      12, 
      'DEVICE-1003', 
      '2025-04-25 23:23:02', 
      N'Person', 
      0.666, 
      N'https://storage.example.com/images/detection-96.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      97, 
      4, 
      'DEVICE-1003', 
      '2025-03-22 21:29:54', 
      N'Door', 
      0.963, 
      N'https://storage.example.com/images/detection-97.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      98, 
      15, 
      'DEVICE-1007', 
      '2025-05-10 00:35:10', 
      N'Shelf', 
      0.678, 
      N'https://storage.example.com/images/detection-98.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      99, 
      14, 
      'DEVICE-1007', 
      '2025-05-18 23:18:37', 
      N'Basket', 
      0.781, 
      N'https://storage.example.com/images/detection-99.jpg');
INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      100, 
      3, 
      'DEVICE-1004', 
      '2025-04-04 21:48:06', 
      N'Shelf', 
      0.8391, 
      N'https://storage.example.com/images/detection-100.jpg');

SET IDENTITY_INSERT dbo.bronze_vision_detections OFF;
GO

DELETE FROM dbo.bronze_transcriptions;
GO

SET IDENTITY_INSERT dbo.bronze_transcriptions ON;
GO

INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      1, 
      7, 
      'FACE-1023', 
      'DEVICE-1003', 
      '2025-01-22 10:08:01', 
      N'Is this on sale Yogurt? I appreciate your help.', 
      N'https://storage.example.com/audio/transcript-1.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      2, 
      12, 
      'FACE-1026', 
      'DEVICE-1007', 
      '2025-05-12 13:45:10', 
      N'Is this on sale Coffee? I appreciate your help.', 
      N'https://storage.example.com/audio/transcript-2.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      3, 
      2, 
      'FACE-1049', 
      'DEVICE-1005', 
      '2025-05-16 23:27:37', 
      N'I'm looking for Bread? Thank you.', 
      N'https://storage.example.com/audio/transcript-3.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      4, 
      9, 
      'FACE-1034', 
      'DEVICE-1005', 
      '2025-02-10 06:46:08', 
      N'Where can I find Bread? I'll take that.', 
      N'https://storage.example.com/audio/transcript-4.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      5, 
      13, 
      'FACE-1037', 
      'DEVICE-1005', 
      '2025-04-13 03:19:05', 
      N'Is this on sale Honey? I appreciate your help.', 
      N'https://storage.example.com/audio/transcript-5.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      6, 
      8, 
      'FACE-1007', 
      'DEVICE-1008', 
      '2025-03-04 15:07:22', 
      N'How much is Chips? Thank you.', 
      N'https://storage.example.com/audio/transcript-6.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      7, 
      2, 
      'FACE-1048', 
      'DEVICE-1002', 
      '2025-01-30 22:41:10', 
      N'Where can I find Candy? That's all I needed.', 
      N'https://storage.example.com/audio/transcript-7.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      8, 
      11, 
      'FACE-1025', 
      'DEVICE-1003', 
      '2025-04-07 12:48:24', 
      N'Where can I find Rice? I'll take that.', 
      N'https://storage.example.com/audio/transcript-8.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      9, 
      6, 
      'FACE-1002', 
      'DEVICE-1004', 
      '2025-01-25 00:08:37', 
      N'How much is Body Wash? I'll take that.', 
      N'https://storage.example.com/audio/transcript-9.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      10, 
      8, 
      'FACE-1041', 
      'DEVICE-1004', 
      '2025-01-04 19:10:15', 
      N'Where can I find Pepper? Thank you.', 
      N'https://storage.example.com/audio/transcript-10.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      11, 
      15, 
      'FACE-1028', 
      'DEVICE-1003', 
      '2025-05-18 15:06:45', 
      N'How much is Pasta? I appreciate your help.', 
      N'https://storage.example.com/audio/transcript-11.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      12, 
      10, 
      'FACE-1010', 
      'DEVICE-1007', 
      '2025-01-02 20:52:11', 
      N'I'm looking for Vinegar? I appreciate your help.', 
      N'https://storage.example.com/audio/transcript-12.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      13, 
      15, 
      'FACE-1028', 
      'DEVICE-1005', 
      '2025-03-09 05:43:26', 
      N'I'm looking for Mustard? That's all I needed.', 
      N'https://storage.example.com/audio/transcript-13.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      14, 
      10, 
      'FACE-1008', 
      'DEVICE-1004', 
      '2025-02-18 10:46:01', 
      N'I'm looking for Salt? Thank you.', 
      N'https://storage.example.com/audio/transcript-14.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      15, 
      11, 
      'FACE-1020', 
      'DEVICE-1003', 
      '2025-03-02 21:15:22', 
      N'Is this on sale Candy? Let me think about it.', 
      N'https://storage.example.com/audio/transcript-15.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      16, 
      8, 
      'FACE-1034', 
      'DEVICE-1001', 
      '2025-02-16 21:18:12', 
      N'Where can I find Tea? I appreciate your help.', 
      N'https://storage.example.com/audio/transcript-16.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      17, 
      4, 
      'FACE-1006', 
      'DEVICE-1004', 
      '2025-04-17 01:15:56', 
      N'How much is Paper Towels? I appreciate your help.', 
      N'https://storage.example.com/audio/transcript-17.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      18, 
      3, 
      'FACE-1020', 
      'DEVICE-1001', 
      '2025-03-09 08:39:15', 
      N'Do you have Salt? I'll take that.', 
      N'https://storage.example.com/audio/transcript-18.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      19, 
      7, 
      'FACE-1008', 
      'DEVICE-1001', 
      '2025-05-11 04:18:42', 
      N'Is this on sale Toilet Paper? Thank you.', 
      N'https://storage.example.com/audio/transcript-19.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      20, 
      7, 
      'FACE-1002', 
      'DEVICE-1008', 
      '2025-02-24 15:24:33', 
      N'Where can I find Laundry Detergent? I'll take that.', 
      N'https://storage.example.com/audio/transcript-20.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      21, 
      10, 
      'FACE-1003', 
      'DEVICE-1008', 
      '2025-01-17 23:33:24', 
      N'How much is Candy? I appreciate your help.', 
      N'https://storage.example.com/audio/transcript-21.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      22, 
      11, 
      'FACE-1047', 
      'DEVICE-1004', 
      '2025-03-16 19:53:08', 
      N'Is this on sale Jam? I'll take that.', 
      N'https://storage.example.com/audio/transcript-22.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      23, 
      3, 
      'FACE-1009', 
      'DEVICE-1004', 
      '2025-02-14 13:11:02', 
      N'Do you have Honey? I'll take that.', 
      N'https://storage.example.com/audio/transcript-23.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      24, 
      5, 
      'FACE-1007', 
      'DEVICE-1003', 
      '2025-04-03 14:34:49', 
      N'Do you have Flour? Let me think about it.', 
      N'https://storage.example.com/audio/transcript-24.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      25, 
      4, 
      'FACE-1037', 
      'DEVICE-1004', 
      '2025-03-20 09:40:30', 
      N'I'm looking for Toothpaste? Let me think about it.', 
      N'https://storage.example.com/audio/transcript-25.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      26, 
      10, 
      'FACE-1015', 
      'DEVICE-1002', 
      '2025-04-23 07:06:10', 
      N'Do you have Cookies? I appreciate your help.', 
      N'https://storage.example.com/audio/transcript-26.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      27, 
      12, 
      'FACE-1039', 
      'DEVICE-1009', 
      '2025-02-24 08:30:25', 
      N'How much is Toothpaste? Thank you.', 
      N'https://storage.example.com/audio/transcript-27.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      28, 
      12, 
      'FACE-1020', 
      'DEVICE-1005', 
      '2025-05-03 07:38:48', 
      N'I'm looking for Toilet Paper? Let me think about it.', 
      N'https://storage.example.com/audio/transcript-28.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      29, 
      15, 
      'FACE-1009', 
      'DEVICE-1007', 
      '2025-01-15 06:06:06', 
      N'Is this on sale Paper Towels? Let me think about it.', 
      N'https://storage.example.com/audio/transcript-29.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      30, 
      12, 
      'FACE-1036', 
      'DEVICE-1007', 
      '2025-02-28 21:24:07', 
      N'Is this on sale Bread? I appreciate your help.', 
      N'https://storage.example.com/audio/transcript-30.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      31, 
      7, 
      'FACE-1048', 
      'DEVICE-1003', 
      '2025-02-10 12:06:58', 
      N'How much is Body Wash? I appreciate your help.', 
      N'https://storage.example.com/audio/transcript-31.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      32, 
      5, 
      'FACE-1034', 
      'DEVICE-1001', 
      '2025-01-09 06:42:12', 
      N'Is this on sale Canned Beans? I appreciate your help.', 
      N'https://storage.example.com/audio/transcript-32.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      33, 
      13, 
      'FACE-1031', 
      'DEVICE-1006', 
      '2025-05-15 10:50:42', 
      N'Is this on sale Canned Tuna? I appreciate your help.', 
      N'https://storage.example.com/audio/transcript-33.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      34, 
      13, 
      'FACE-1012', 
      'DEVICE-1003', 
      '2025-02-16 16:13:43', 
      N'Where can I find Cooking Oil? That's all I needed.', 
      N'https://storage.example.com/audio/transcript-34.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      35, 
      2, 
      'FACE-1027', 
      'DEVICE-1002', 
      '2025-04-19 10:17:05', 
      N'Do you have Soap? Thank you.', 
      N'https://storage.example.com/audio/transcript-35.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      36, 
      1, 
      'FACE-1040', 
      'DEVICE-1004', 
      '2025-03-26 12:53:01', 
      N'Where can I find Milk? I'll take that.', 
      N'https://storage.example.com/audio/transcript-36.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      37, 
      9, 
      'FACE-1043', 
      'DEVICE-1005', 
      '2025-01-02 06:19:04', 
      N'Where can I find Juice? I appreciate your help.', 
      N'https://storage.example.com/audio/transcript-37.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      38, 
      8, 
      'FACE-1031', 
      'DEVICE-1007', 
      '2024-12-31 19:05:32', 
      N'Where can I find Facial Tissue? Thank you.', 
      N'https://storage.example.com/audio/transcript-38.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      39, 
      8, 
      'FACE-1034', 
      'DEVICE-1003', 
      '2025-03-02 03:23:11', 
      N'How much is Yogurt? That's all I needed.', 
      N'https://storage.example.com/audio/transcript-39.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      40, 
      12, 
      'FACE-1028', 
      'DEVICE-1004', 
      '2025-05-12 02:35:38', 
      N'I'm looking for Cat Food? Thank you.', 
      N'https://storage.example.com/audio/transcript-40.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      41, 
      9, 
      'FACE-1041', 
      'DEVICE-1008', 
      '2025-01-30 17:51:04', 
      N'Where can I find Baby Wipes? Thank you.', 
      N'https://storage.example.com/audio/transcript-41.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      42, 
      3, 
      'FACE-1045', 
      'DEVICE-1005', 
      '2025-05-06 07:23:07', 
      N'Is this on sale Vinegar? That's all I needed.', 
      N'https://storage.example.com/audio/transcript-42.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      43, 
      12, 
      'FACE-1017', 
      'DEVICE-1005', 
      '2025-03-13 11:38:59', 
      N'How much is Laundry Detergent? I appreciate your help.', 
      N'https://storage.example.com/audio/transcript-43.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      44, 
      7, 
      'FACE-1002', 
      'DEVICE-1009', 
      '2025-04-06 09:06:45', 
      N'Do you have Sugar? Let me think about it.', 
      N'https://storage.example.com/audio/transcript-44.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      45, 
      15, 
      'FACE-1029', 
      'DEVICE-1002', 
      '2025-03-20 18:51:41', 
      N'Where can I find Honey? I'll take that.', 
      N'https://storage.example.com/audio/transcript-45.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      46, 
      10, 
      'FACE-1010', 
      'DEVICE-1003', 
      '2025-04-23 01:27:44', 
      N'Is this on sale Canned Tuna? Thank you.', 
      N'https://storage.example.com/audio/transcript-46.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      47, 
      10, 
      'FACE-1020', 
      'DEVICE-1005', 
      '2025-04-06 22:18:03', 
      N'Do you have Bread? That's all I needed.', 
      N'https://storage.example.com/audio/transcript-47.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      48, 
      2, 
      'FACE-1038', 
      'DEVICE-1007', 
      '2025-02-25 08:13:13', 
      N'I'm looking for Cereal? I appreciate your help.', 
      N'https://storage.example.com/audio/transcript-48.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      49, 
      14, 
      'FACE-1037', 
      'DEVICE-1005', 
      '2025-04-30 11:56:34', 
      N'Where can I find Body Wash? I appreciate your help.', 
      N'https://storage.example.com/audio/transcript-49.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      50, 
      5, 
      'FACE-1008', 
      'DEVICE-1008', 
      '2025-01-21 06:55:44', 
      N'Is this on sale Soft Drink? That's all I needed.', 
      N'https://storage.example.com/audio/transcript-50.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      51, 
      12, 
      'FACE-1017', 
      'DEVICE-1006', 
      '2025-03-03 23:28:44', 
      N'Where can I find Canned Tuna? Let me think about it.', 
      N'https://storage.example.com/audio/transcript-51.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      52, 
      4, 
      'FACE-1010', 
      'DEVICE-1003', 
      '2025-03-05 14:56:57', 
      N'How much is Shampoo? Let me think about it.', 
      N'https://storage.example.com/audio/transcript-52.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      53, 
      10, 
      'FACE-1001', 
      'DEVICE-1009', 
      '2025-05-02 12:24:50', 
      N'I'm looking for Mustard? Thank you.', 
      N'https://storage.example.com/audio/transcript-53.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      54, 
      11, 
      'FACE-1030', 
      'DEVICE-1001', 
      '2025-01-18 05:10:07', 
      N'Where can I find Coffee? That's all I needed.', 
      N'https://storage.example.com/audio/transcript-54.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      55, 
      3, 
      'FACE-1011', 
      'DEVICE-1005', 
      '2025-02-08 13:25:59', 
      N'Do you have Cooking Oil? That's all I needed.', 
      N'https://storage.example.com/audio/transcript-55.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      56, 
      4, 
      'FACE-1036', 
      'DEVICE-1003', 
      '2025-01-25 22:55:14', 
      N'Is this on sale Honey? That's all I needed.', 
      N'https://storage.example.com/audio/transcript-56.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      57, 
      7, 
      'FACE-1049', 
      'DEVICE-1008', 
      '2025-02-05 13:55:08', 
      N'I'm looking for Ice Cream? I'll take that.', 
      N'https://storage.example.com/audio/transcript-57.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      58, 
      6, 
      'FACE-1011', 
      'DEVICE-1008', 
      '2025-01-29 16:21:46', 
      N'Is this on sale Frozen Vegetables? Let me think about it.', 
      N'https://storage.example.com/audio/transcript-58.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      59, 
      12, 
      'FACE-1014', 
      'DEVICE-1004', 
      '2025-04-06 20:34:38', 
      N'Where can I find Tea? Let me think about it.', 
      N'https://storage.example.com/audio/transcript-59.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      60, 
      8, 
      'FACE-1038', 
      'DEVICE-1001', 
      '2025-01-01 05:58:24', 
      N'Do you have Frozen Vegetables? I'll take that.', 
      N'https://storage.example.com/audio/transcript-60.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      61, 
      10, 
      'FACE-1048', 
      'DEVICE-1006', 
      '2025-04-25 06:20:34', 
      N'I'm looking for Frozen Pizza? I appreciate your help.', 
      N'https://storage.example.com/audio/transcript-61.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      62, 
      13, 
      'FACE-1007', 
      'DEVICE-1009', 
      '2025-03-22 23:53:55', 
      N'Is this on sale Cat Food? Thank you.', 
      N'https://storage.example.com/audio/transcript-62.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      63, 
      10, 
      'FACE-1032', 
      'DEVICE-1001', 
      '2025-02-03 01:34:23', 
      N'Do you have Cheese? That's all I needed.', 
      N'https://storage.example.com/audio/transcript-63.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      64, 
      3, 
      'FACE-1022', 
      'DEVICE-1006', 
      '2025-03-22 07:37:56', 
      N'Do you have Milk? Thank you.', 
      N'https://storage.example.com/audio/transcript-64.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      65, 
      9, 
      'FACE-1027', 
      'DEVICE-1004', 
      '2025-02-19 13:01:36', 
      N'Where can I find Canned Beans? Let me think about it.', 
      N'https://storage.example.com/audio/transcript-65.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      66, 
      1, 
      'FACE-1030', 
      'DEVICE-1005', 
      '2025-02-22 14:51:36', 
      N'Where can I find Canned Tuna? That's all I needed.', 
      N'https://storage.example.com/audio/transcript-66.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      67, 
      10, 
      'FACE-1041', 
      'DEVICE-1009', 
      '2025-04-12 19:30:20', 
      N'Where can I find Toilet Paper? Let me think about it.', 
      N'https://storage.example.com/audio/transcript-67.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      68, 
      15, 
      'FACE-1019', 
      'DEVICE-1005', 
      '2025-01-03 21:58:37', 
      N'Do you have Ketchup? Thank you.', 
      N'https://storage.example.com/audio/transcript-68.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      69, 
      15, 
      'FACE-1039', 
      'DEVICE-1002', 
      '2025-04-18 02:46:05', 
      N'Do you have Soft Drink? Thank you.', 
      N'https://storage.example.com/audio/transcript-69.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      70, 
      15, 
      'FACE-1021', 
      'DEVICE-1003', 
      '2025-03-21 17:52:47', 
      N'Where can I find Laundry Detergent? Thank you.', 
      N'https://storage.example.com/audio/transcript-70.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      71, 
      8, 
      'FACE-1039', 
      'DEVICE-1005', 
      '2025-03-17 07:00:09', 
      N'Do you have Pepper? Thank you.', 
      N'https://storage.example.com/audio/transcript-71.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      72, 
      7, 
      'FACE-1004', 
      'DEVICE-1000', 
      '2025-04-12 18:27:11', 
      N'Where can I find Coffee? Let me think about it.', 
      N'https://storage.example.com/audio/transcript-72.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      73, 
      5, 
      'FACE-1001', 
      'DEVICE-1000', 
      '2025-04-11 05:02:46', 
      N'Do you have Butter? I appreciate your help.', 
      N'https://storage.example.com/audio/transcript-73.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      74, 
      6, 
      'FACE-1037', 
      'DEVICE-1005', 
      '2025-03-04 14:30:59', 
      N'Where can I find Soft Drink? Thank you.', 
      N'https://storage.example.com/audio/transcript-74.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      75, 
      2, 
      'FACE-1014', 
      'DEVICE-1004', 
      '2025-02-24 11:08:15', 
      N'Do you have Dog Food? I appreciate your help.', 
      N'https://storage.example.com/audio/transcript-75.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      76, 
      13, 
      'FACE-1007', 
      'DEVICE-1002', 
      '2025-04-08 18:55:00', 
      N'Is this on sale Laundry Detergent? I'll take that.', 
      N'https://storage.example.com/audio/transcript-76.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      77, 
      5, 
      'FACE-1040', 
      'DEVICE-1008', 
      '2025-01-30 19:34:27', 
      N'Is this on sale Dog Food? That's all I needed.', 
      N'https://storage.example.com/audio/transcript-77.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      78, 
      5, 
      'FACE-1044', 
      'DEVICE-1000', 
      '2025-02-17 10:15:56', 
      N'Is this on sale Flour? I'll take that.', 
      N'https://storage.example.com/audio/transcript-78.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      79, 
      3, 
      'FACE-1039', 
      'DEVICE-1001', 
      '2025-01-20 22:57:00', 
      N'Where can I find Chocolate? Thank you.', 
      N'https://storage.example.com/audio/transcript-79.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      80, 
      11, 
      'FACE-1001', 
      'DEVICE-1006', 
      '2025-03-10 03:33:03', 
      N'I'm looking for Jam? That's all I needed.', 
      N'https://storage.example.com/audio/transcript-80.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      81, 
      7, 
      'FACE-1045', 
      'DEVICE-1005', 
      '2025-05-09 00:53:43', 
      N'Where can I find Ketchup? That's all I needed.', 
      N'https://storage.example.com/audio/transcript-81.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      82, 
      7, 
      'FACE-1010', 
      'DEVICE-1000', 
      '2025-02-05 04:52:38', 
      N'Is this on sale Paper Towels? I appreciate your help.', 
      N'https://storage.example.com/audio/transcript-82.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      83, 
      3, 
      'FACE-1007', 
      'DEVICE-1004', 
      '2025-05-19 09:12:22', 
      N'Where can I find Body Wash? That's all I needed.', 
      N'https://storage.example.com/audio/transcript-83.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      84, 
      9, 
      'FACE-1019', 
      'DEVICE-1001', 
      '2025-04-17 11:20:53', 
      N'How much is Cat Food? Let me think about it.', 
      N'https://storage.example.com/audio/transcript-84.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      85, 
      3, 
      'FACE-1048', 
      'DEVICE-1002', 
      '2025-02-22 03:26:14', 
      N'How much is Mustard? I appreciate your help.', 
      N'https://storage.example.com/audio/transcript-85.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      86, 
      3, 
      'FACE-1011', 
      'DEVICE-1007', 
      '2025-03-11 09:43:28', 
      N'Where can I find Toothpaste? That's all I needed.', 
      N'https://storage.example.com/audio/transcript-86.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      87, 
      9, 
      'FACE-1033', 
      'DEVICE-1003', 
      '2025-03-29 06:10:10', 
      N'Is this on sale Toilet Paper? I appreciate your help.', 
      N'https://storage.example.com/audio/transcript-87.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      88, 
      5, 
      'FACE-1012', 
      'DEVICE-1008', 
      '2024-12-31 18:47:48', 
      N'Do you have Candy? I'll take that.', 
      N'https://storage.example.com/audio/transcript-88.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      89, 
      3, 
      'FACE-1020', 
      'DEVICE-1000', 
      '2025-03-11 15:09:55', 
      N'I'm looking for Canned Tuna? Let me think about it.', 
      N'https://storage.example.com/audio/transcript-89.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      90, 
      5, 
      'FACE-1045', 
      'DEVICE-1005', 
      '2025-01-27 22:25:44', 
      N'Do you have Candy? That's all I needed.', 
      N'https://storage.example.com/audio/transcript-90.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      91, 
      8, 
      'FACE-1037', 
      'DEVICE-1002', 
      '2025-01-31 09:37:47', 
      N'Is this on sale Frozen Vegetables? I'll take that.', 
      N'https://storage.example.com/audio/transcript-91.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      92, 
      12, 
      'FACE-1042', 
      'DEVICE-1001', 
      '2025-03-10 03:36:31', 
      N'Where can I find Soft Drink? Let me think about it.', 
      N'https://storage.example.com/audio/transcript-92.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      93, 
      4, 
      'FACE-1035', 
      'DEVICE-1002', 
      '2025-02-12 00:01:09', 
      N'Where can I find Pepper? That's all I needed.', 
      N'https://storage.example.com/audio/transcript-93.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      94, 
      14, 
      'FACE-1022', 
      'DEVICE-1009', 
      '2025-03-18 10:26:35', 
      N'Is this on sale Crackers? Thank you.', 
      N'https://storage.example.com/audio/transcript-94.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      95, 
      3, 
      'FACE-1013', 
      'DEVICE-1002', 
      '2025-04-25 18:48:50', 
      N'Is this on sale Bread? I appreciate your help.', 
      N'https://storage.example.com/audio/transcript-95.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      96, 
      2, 
      'FACE-1006', 
      'DEVICE-1007', 
      '2025-03-02 12:44:11', 
      N'Is this on sale Soft Drink? Thank you.', 
      N'https://storage.example.com/audio/transcript-96.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      97, 
      1, 
      'FACE-1005', 
      'DEVICE-1009', 
      '2025-03-08 03:07:16', 
      N'Do you have Eggs? Let me think about it.', 
      N'https://storage.example.com/audio/transcript-97.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      98, 
      12, 
      'FACE-1004', 
      'DEVICE-1007', 
      '2025-01-02 19:15:49', 
      N'Is this on sale Sugar? That's all I needed.', 
      N'https://storage.example.com/audio/transcript-98.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      99, 
      15, 
      'FACE-1022', 
      'DEVICE-1008', 
      '2025-04-11 17:06:14', 
      N'Do you have Soap? Thank you.', 
      N'https://storage.example.com/audio/transcript-99.wav', 
      'en-PH');
INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      100, 
      7, 
      'FACE-1014', 
      'DEVICE-1007', 
      '2025-01-26 02:08:34', 
      N'I'm looking for Dish Soap? Let me think about it.', 
      N'https://storage.example.com/audio/transcript-100.wav', 
      'en-PH');

SET IDENTITY_INSERT dbo.bronze_transcriptions OFF;
GO

DELETE FROM dbo.SessionMatches;
GO

SET IDENTITY_INSERT dbo.SessionMatches ON;
GO

INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      1, 
      'INT-10051', 
      37, 
      61, 
      0.9566, 
      401, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      2, 
      'INT-10009', 
      72, 
      19, 
      0.9215, 
      3667, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      3, 
      'INT-10047', 
      67, 
      70, 
      0.9573, 
      1896, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      4, 
      'INT-10028', 
      79, 
      51, 
      0.8802, 
      3834, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      5, 
      'INT-10041', 
      51, 
      90, 
      0.9715, 
      4079, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      6, 
      'INT-10022', 
      34, 
      85, 
      0.9763, 
      4157, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      7, 
      'INT-10059', 
      42, 
      73, 
      0.7021, 
      2807, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      8, 
      'INT-10017', 
      49, 
      79, 
      0.949, 
      584, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      9, 
      'INT-10057', 
      35, 
      93, 
      0.9812, 
      4464, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      10, 
      'INT-10046', 
      5, 
      39, 
      0.7028, 
      3531, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      11, 
      'INT-10021', 
      37, 
      27, 
      0.951, 
      2851, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      12, 
      'INT-10075', 
      58, 
      5, 
      0.8119, 
      540, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      13, 
      'INT-10055', 
      20, 
      96, 
      0.8676, 
      4369, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      14, 
      'INT-10044', 
      98, 
      64, 
      0.823, 
      2639, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      15, 
      'INT-10066', 
      77, 
      42, 
      0.6764, 
      1653, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      16, 
      'INT-10093', 
      59, 
      14, 
      0.8413, 
      15, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      17, 
      'INT-10062', 
      15, 
      23, 
      0.907, 
      2095, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      18, 
      'INT-10046', 
      39, 
      23, 
      0.6425, 
      313, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      19, 
      'INT-10097', 
      40, 
      11, 
      0.609, 
      1925, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      20, 
      'INT-10100', 
      96, 
      38, 
      0.7584, 
      2368, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      21, 
      'INT-10009', 
      22, 
      69, 
      0.663, 
      3524, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      22, 
      'INT-10053', 
      24, 
      70, 
      0.9353, 
      3173, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      23, 
      'INT-10004', 
      67, 
      55, 
      0.7351, 
      4262, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      24, 
      'INT-10029', 
      95, 
      32, 
      0.6832, 
      4482, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      25, 
      'INT-10093', 
      48, 
      20, 
      0.6323, 
      1554, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      26, 
      'INT-10093', 
      69, 
      80, 
      0.7489, 
      4161, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      27, 
      'INT-10001', 
      2, 
      64, 
      0.8956, 
      3280, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      28, 
      'INT-10012', 
      87, 
      62, 
      0.7469, 
      4136, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      29, 
      'INT-10020', 
      66, 
      4, 
      0.966, 
      3867, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      30, 
      'INT-10021', 
      89, 
      100, 
      0.6624, 
      4600, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      31, 
      'INT-10039', 
      92, 
      75, 
      0.7648, 
      1279, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      32, 
      'INT-10099', 
      90, 
      50, 
      0.8074, 
      2179, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      33, 
      'INT-10070', 
      91, 
      90, 
      0.7403, 
      1988, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      34, 
      'INT-10054', 
      2, 
      20, 
      0.7746, 
      4356, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      35, 
      'INT-10092', 
      80, 
      27, 
      0.8353, 
      1100, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      36, 
      'INT-10030', 
      95, 
      37, 
      0.9087, 
      3291, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      37, 
      'INT-10050', 
      99, 
      3, 
      0.8472, 
      2483, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      38, 
      'INT-10037', 
      72, 
      23, 
      0.9005, 
      393, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      39, 
      'INT-10037', 
      58, 
      18, 
      0.7356, 
      3482, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      40, 
      'INT-10020', 
      41, 
      23, 
      0.6377, 
      236, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      41, 
      'INT-10090', 
      75, 
      36, 
      0.8526, 
      1233, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      42, 
      'INT-10034', 
      40, 
      53, 
      0.7421, 
      424, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      43, 
      'INT-10007', 
      97, 
      28, 
      0.659, 
      1412, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      44, 
      'INT-10003', 
      58, 
      29, 
      0.8981, 
      1087, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      45, 
      'INT-10001', 
      19, 
      98, 
      0.7233, 
      2277, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      46, 
      'INT-10041', 
      10, 
      8, 
      0.7237, 
      3156, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      47, 
      'INT-10078', 
      69, 
      54, 
      0.7669, 
      3753, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      48, 
      'INT-10094', 
      86, 
      64, 
      0.8678, 
      1647, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      49, 
      'INT-10085', 
      7, 
      69, 
      0.6519, 
      3752, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      50, 
      'INT-10038', 
      95, 
      32, 
      0.9256, 
      3897, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      51, 
      'INT-10058', 
      22, 
      20, 
      0.6793, 
      2951, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      52, 
      'INT-10034', 
      42, 
      12, 
      0.9334, 
      2553, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      53, 
      'INT-10047', 
      73, 
      91, 
      0.9156, 
      2324, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      54, 
      'INT-10069', 
      96, 
      77, 
      0.8046, 
      4563, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      55, 
      'INT-10058', 
      18, 
      70, 
      0.8479, 
      3478, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      56, 
      'INT-10061', 
      68, 
      75, 
      0.6115, 
      13, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      57, 
      'INT-10072', 
      22, 
      14, 
      0.6142, 
      4853, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      58, 
      'INT-10050', 
      22, 
      37, 
      0.8236, 
      3123, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      59, 
      'INT-10009', 
      76, 
      12, 
      0.9006, 
      106, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      60, 
      'INT-10018', 
      63, 
      80, 
      0.7444, 
      3649, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      61, 
      'INT-10067', 
      27, 
      82, 
      0.9921, 
      4138, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      62, 
      'INT-10007', 
      64, 
      6, 
      0.6657, 
      2095, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      63, 
      'INT-10026', 
      59, 
      44, 
      0.7335, 
      225, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      64, 
      'INT-10022', 
      16, 
      73, 
      0.73, 
      1256, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      65, 
      'INT-10086', 
      44, 
      9, 
      0.7699, 
      2481, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      66, 
      'INT-10074', 
      77, 
      97, 
      0.6319, 
      4759, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      67, 
      'INT-10039', 
      35, 
      13, 
      0.9659, 
      4810, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      68, 
      'INT-10035', 
      50, 
      22, 
      0.6545, 
      1096, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      69, 
      'INT-10066', 
      99, 
      94, 
      0.9405, 
      2773, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      70, 
      'INT-10058', 
      87, 
      69, 
      0.8988, 
      4542, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      71, 
      'INT-10005', 
      35, 
      15, 
      0.9684, 
      3265, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      72, 
      'INT-10052', 
      43, 
      1, 
      0.7716, 
      2436, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      73, 
      'INT-10031', 
      17, 
      22, 
      0.8846, 
      2225, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      74, 
      'INT-10099', 
      21, 
      40, 
      0.6238, 
      3670, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      75, 
      'INT-10075', 
      15, 
      78, 
      0.7325, 
      4760, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      76, 
      'INT-10007', 
      34, 
      45, 
      0.6595, 
      179, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      77, 
      'INT-10067', 
      33, 
      29, 
      0.9568, 
      1928, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      78, 
      'INT-10017', 
      9, 
      73, 
      0.7828, 
      1106, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      79, 
      'INT-10002', 
      75, 
      3, 
      0.6749, 
      4901, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      80, 
      'INT-10041', 
      9, 
      78, 
      0.789, 
      4151, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      81, 
      'INT-10035', 
      57, 
      53, 
      0.6978, 
      3779, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      82, 
      'INT-10062', 
      69, 
      55, 
      0.7285, 
      4641, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      83, 
      'INT-10029', 
      64, 
      60, 
      0.8715, 
      961, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      84, 
      'INT-10077', 
      87, 
      93, 
      0.7684, 
      2907, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      85, 
      'INT-10067', 
      26, 
      98, 
      0.6881, 
      1682, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      86, 
      'INT-10015', 
      34, 
      93, 
      0.6687, 
      4839, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      87, 
      'INT-10003', 
      14, 
      57, 
      0.7836, 
      1384, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      88, 
      'INT-10022', 
      97, 
      3, 
      0.879, 
      3665, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      89, 
      'INT-10052', 
      82, 
      32, 
      0.605, 
      791, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      90, 
      'INT-10059', 
      18, 
      58, 
      0.9095, 
      1355, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      91, 
      'INT-10068', 
      59, 
      29, 
      0.713, 
      4940, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      92, 
      'INT-10083', 
      27, 
      73, 
      0.9927, 
      955, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      93, 
      'INT-10055', 
      14, 
      28, 
      0.8875, 
      1363, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      94, 
      'INT-10075', 
      12, 
      94, 
      0.6066, 
      3665, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      95, 
      'INT-10022', 
      24, 
      79, 
      0.6452, 
      1431, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      96, 
      'INT-10077', 
      30, 
      47, 
      0.7097, 
      2299, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      97, 
      'INT-10050', 
      97, 
      28, 
      0.6234, 
      4045, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      98, 
      'INT-10044', 
      25, 
      87, 
      0.6102, 
      925, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      99, 
      'INT-10085', 
      44, 
      97, 
      0.9623, 
      3705, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      100, 
      'INT-10041', 
      80, 
      50, 
      0.6493, 
      690, 
      'TimestampCorrelation', 
      '2025-05-20 04:51:53');

SET IDENTITY_INSERT dbo.SessionMatches OFF;
GO

DELETE FROM dbo.SalesInteractionBrands;
GO

SET IDENTITY_INSERT dbo.SalesInteractionBrands ON;
GO

INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      1, 
      'INT-10001', 
      N'Premium Select', 
      0.7993, 
      'Audio', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      2, 
      'INT-10056', 
      N'Daily Essentials', 
      0.9655, 
      'Combined', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      3, 
      'INT-10030', 
      N'Sparkle', 
      0.7541, 
      'Visual', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      4, 
      'INT-10096', 
      N'Premium Select', 
      0.958, 
      'Audio', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      5, 
      'INT-10039', 
      N'Morning Fresh', 
      0.9839, 
      'Visual', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      6, 
      'INT-10038', 
      N'Pure Products', 
      0.9874, 
      'Visual', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      7, 
      'INT-10037', 
      N'Natural Choice', 
      0.9557, 
      'Combined', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      8, 
      'INT-10044', 
      N'Family Choice', 
      0.7225, 
      'Combined', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      9, 
      'INT-10017', 
      N'Daily Essentials', 
      0.7639, 
      'Audio', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      10, 
      'INT-10083', 
      N'Fresh Foods', 
      0.8431, 
      'Combined', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      11, 
      'INT-10010', 
      N'Mega Brand', 
      0.9265, 
      'Combined', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      12, 
      'INT-10097', 
      N'Natural Choice', 
      0.8038, 
      'Audio', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      13, 
      'INT-10036', 
      N'Golden Foods', 
      0.7016, 
      'Audio', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      14, 
      'INT-10001', 
      N'Premium Select', 
      0.9109, 
      'Visual', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      15, 
      'INT-10020', 
      N'Sunshine', 
      0.9337, 
      'Audio', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      16, 
      'INT-10026', 
      N'Silver Line', 
      0.802, 
      'Combined', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      17, 
      'INT-10001', 
      N'Daily Essentials', 
      0.85, 
      'Visual', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      18, 
      'INT-10056', 
      N'Tropical Delight', 
      0.7764, 
      'Combined', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      19, 
      'INT-10078', 
      N'Tropical Delight', 
      0.9207, 
      'Combined', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      20, 
      'INT-10004', 
      N'Quick Snack', 
      0.7267, 
      'Audio', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      21, 
      'INT-10029', 
      N'Pure Products', 
      0.7505, 
      'Combined', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      22, 
      'INT-10054', 
      N'Pure Products', 
      0.7507, 
      'Visual', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      23, 
      'INT-10044', 
      N'Value Pack', 
      0.956, 
      'Combined', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      24, 
      'INT-10077', 
      N'Quick Snack', 
      0.7379, 
      'Combined', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      25, 
      'INT-10036', 
      N'Pure Products', 
      0.8985, 
      'Visual', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      26, 
      'INT-10087', 
      N'Natural Choice', 
      0.7708, 
      'Visual', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      27, 
      'INT-10042', 
      N'Morning Fresh', 
      0.9945, 
      'Combined', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      28, 
      'INT-10011', 
      N'Royal Goods', 
      0.738, 
      'Visual', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      29, 
      'INT-10020', 
      N'Sunshine', 
      0.746, 
      'Audio', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      30, 
      'INT-10038', 
      N'Sparkle', 
      0.8779, 
      'Visual', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      31, 
      'INT-10022', 
      N'Fresh Foods', 
      0.7454, 
      'Visual', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      32, 
      'INT-10009', 
      N'Quick Snack', 
      0.8114, 
      'Combined', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      33, 
      'INT-10012', 
      N'Premium Select', 
      0.8537, 
      'Visual', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      34, 
      'INT-10021', 
      N'Pure Products', 
      0.913, 
      'Visual', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      35, 
      'INT-10098', 
      N'Daily Essentials', 
      0.8062, 
      'Combined', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      36, 
      'INT-10015', 
      N'Island Breeze', 
      0.9181, 
      'Audio', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      37, 
      'INT-10031', 
      N'Royal Goods', 
      0.9281, 
      'Audio', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      38, 
      'INT-10038', 
      N'Quick Snack', 
      0.7275, 
      'Visual', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      39, 
      'INT-10009', 
      N'Mega Brand', 
      0.893, 
      'Combined', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      40, 
      'INT-10060', 
      N'Mega Brand', 
      0.9947, 
      'Combined', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      41, 
      'INT-10088', 
      N'Mega Brand', 
      0.7336, 
      'Audio', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      42, 
      'INT-10004', 
      N'Silver Line', 
      0.8511, 
      'Audio', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      43, 
      'INT-10052', 
      N'Island Breeze', 
      0.9578, 
      'Combined', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      44, 
      'INT-10063', 
      N'Family Choice', 
      0.7055, 
      'Audio', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      45, 
      'INT-10065', 
      N'Royal Goods', 
      0.9861, 
      'Audio', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      46, 
      'INT-10043', 
      N'Royal Goods', 
      0.9569, 
      'Audio', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      47, 
      'INT-10096', 
      N'Ultra Care', 
      0.7134, 
      'Visual', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      48, 
      'INT-10060', 
      N'Value Pack', 
      0.9179, 
      'Audio', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      49, 
      'INT-10043', 
      N'Tropical Delight', 
      0.9997, 
      'Combined', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      50, 
      'INT-10044', 
      N'Tropical Delight', 
      0.9004, 
      'Combined', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      51, 
      'INT-10042', 
      N'Family Choice', 
      0.7055, 
      'Audio', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      52, 
      'INT-10031', 
      N'Ultra Care', 
      0.8349, 
      'Audio', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      53, 
      'INT-10017', 
      N'Super Clean', 
      0.7884, 
      'Visual', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      54, 
      'INT-10094', 
      N'Mega Brand', 
      0.9122, 
      'Visual', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      55, 
      'INT-10036', 
      N'Super Clean', 
      0.8036, 
      'Visual', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      56, 
      'INT-10081', 
      N'Super Clean', 
      0.9792, 
      'Audio', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      57, 
      'INT-10052', 
      N'Sparkle', 
      0.9486, 
      'Combined', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      58, 
      'INT-10022', 
      N'Ultra Care', 
      0.8725, 
      'Combined', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      59, 
      'INT-10004', 
      N'Super Clean', 
      0.7801, 
      'Visual', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      60, 
      'INT-10079', 
      N'Mega Brand', 
      0.77, 
      'Audio', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      61, 
      'INT-10072', 
      N'Sunshine', 
      0.8137, 
      'Audio', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      62, 
      'INT-10013', 
      N'Family Choice', 
      0.7864, 
      'Audio', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      63, 
      'INT-10089', 
      N'Tropical Delight', 
      0.934, 
      'Visual', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      64, 
      'INT-10052', 
      N'Natural Choice', 
      0.8035, 
      'Audio', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      65, 
      'INT-10020', 
      N'Premium Select', 
      0.964, 
      'Audio', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      66, 
      'INT-10067', 
      N'Natural Choice', 
      0.8141, 
      'Audio', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      67, 
      'INT-10080', 
      N'Value Pack', 
      0.8008, 
      'Audio', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      68, 
      'INT-10050', 
      N'Natural Choice', 
      0.8576, 
      'Combined', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      69, 
      'INT-10030', 
      N'Silver Line', 
      0.817, 
      'Audio', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      70, 
      'INT-10042', 
      N'Fresh Foods', 
      0.8285, 
      'Audio', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      71, 
      'INT-10088', 
      N'Tasty Treats', 
      0.8956, 
      'Combined', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      72, 
      'INT-10099', 
      N'Family Choice', 
      0.7166, 
      'Visual', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      73, 
      'INT-10079', 
      N'Golden Foods', 
      0.9515, 
      'Audio', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      74, 
      'INT-10017', 
      N'Daily Essentials', 
      0.9502, 
      'Visual', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      75, 
      'INT-10042', 
      N'Sparkle', 
      0.9674, 
      'Visual', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      76, 
      'INT-10051', 
      N'Sunshine', 
      0.7112, 
      'Audio', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      77, 
      'INT-10036', 
      N'Royal Goods', 
      0.9798, 
      'Combined', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      78, 
      'INT-10082', 
      N'Value Pack', 
      0.8541, 
      'Visual', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      79, 
      'INT-10075', 
      N'Natural Choice', 
      0.7096, 
      'Audio', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      80, 
      'INT-10018', 
      N'Tropical Delight', 
      0.8717, 
      'Visual', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      81, 
      'INT-10026', 
      N'Super Clean', 
      0.831, 
      'Audio', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      82, 
      'INT-10086', 
      N'Natural Choice', 
      0.7584, 
      'Visual', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      83, 
      'INT-10022', 
      N'Value Pack', 
      0.7477, 
      'Audio', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      84, 
      'INT-10011', 
      N'Mega Brand', 
      0.894, 
      'Audio', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      85, 
      'INT-10007', 
      N'Daily Essentials', 
      0.9114, 
      'Visual', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      86, 
      'INT-10028', 
      N'Value Pack', 
      0.9943, 
      'Audio', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      87, 
      'INT-10001', 
      N'Value Pack', 
      0.9249, 
      'Visual', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      88, 
      'INT-10066', 
      N'Quick Snack', 
      0.9322, 
      'Visual', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      89, 
      'INT-10027', 
      N'Value Pack', 
      0.7559, 
      'Visual', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      90, 
      'INT-10087', 
      N'Sparkle', 
      0.8713, 
      'Visual', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      91, 
      'INT-10089', 
      N'Sparkle', 
      0.9279, 
      'Audio', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      92, 
      'INT-10051', 
      N'Island Breeze', 
      0.9952, 
      'Combined', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      93, 
      'INT-10077', 
      N'Quick Snack', 
      0.7055, 
      'Combined', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      94, 
      'INT-10057', 
      N'Ultra Care', 
      0.7078, 
      'Combined', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      95, 
      'INT-10055', 
      N'Royal Goods', 
      0.8845, 
      'Combined', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      96, 
      'INT-10070', 
      N'Tasty Treats', 
      0.7651, 
      'Combined', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      97, 
      'INT-10029', 
      N'Fresh Foods', 
      0.9979, 
      'Combined', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      98, 
      'INT-10069', 
      N'Value Pack', 
      0.9041, 
      'Visual', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      99, 
      'INT-10075', 
      N'Royal Goods', 
      0.7413, 
      'Combined', 
      '2025-05-20 04:51:53');
INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      100, 
      'INT-10018', 
      N'Golden Foods', 
      0.7694, 
      'Combined', 
      '2025-05-20 04:51:53');

SET IDENTITY_INSERT dbo.SalesInteractionBrands OFF;
GO

