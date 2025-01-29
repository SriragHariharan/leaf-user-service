-- DropForeignKey
ALTER TABLE `Friends` DROP FOREIGN KEY `Friends_friendID_fkey`;

-- DropForeignKey
ALTER TABLE `Friends` DROP FOREIGN KEY `Friends_userID_fkey`;

-- AddForeignKey
ALTER TABLE `Friends` ADD CONSTRAINT `FK_UserFriends_User` FOREIGN KEY (`userID`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Friends` ADD CONSTRAINT `FK_FriendOf_User` FOREIGN KEY (`friendID`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Friends` ADD CONSTRAINT `FK_Friends_Profile` FOREIGN KEY (`userID`) REFERENCES `Profile`(`userID`) ON DELETE RESTRICT ON UPDATE CASCADE;
