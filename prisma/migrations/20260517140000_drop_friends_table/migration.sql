-- DropForeignKey
ALTER TABLE `Friends` DROP FOREIGN KEY `FK_UserFriends_User`;

-- DropForeignKey
ALTER TABLE `Friends` DROP FOREIGN KEY `FK_FriendOf_User`;

-- DropForeignKey
ALTER TABLE `Friends` DROP FOREIGN KEY `FK_Friends_Profile`;

-- DropTable
DROP TABLE `Friends`;
