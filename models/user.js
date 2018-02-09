'use strict'

const EventFields = require('../lib/event_fields')

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id_seq: DataTypes.BIGINT,
    domain_userid: DataTypes.ARRAY(DataTypes.STRING),
    network_userid: DataTypes.ARRAY(DataTypes.STRING),
    user_fingerprint: DataTypes.ARRAY(DataTypes.STRING),
    sso_guid: DataTypes.ARRAY(DataTypes.UUID),
    gr_master_person_id: DataTypes.ARRAY(DataTypes.UUID),
    marketing_cloud_id: DataTypes.ARRAY(DataTypes.STRING),
    android_idfa: DataTypes.ARRAY(DataTypes.STRING),
    apple_idfa: DataTypes.ARRAY(DataTypes.STRING)
  }, {
    tableName: 'users',
    underscored: true,
    timestamps: false,
    classMethods: {
      parseRecord: (record) => {
        const payload = Buffer.from(record.kinesis.data, 'base64').toString('ascii')
        const fields = payload.split('\t')
        // console.log(fields[Field.network_userid])
        // User.findAll({
        //   where: {
        //     [Op.or]: [
        //       {domain_userid: {[Op.contains]: [fields[Field.domain_userid]]}},
        //       {network_userid: {[Op.contains]: [fields[Field.network_userid]]}}
        //     ]
        //   }
        // }).then(users => {
        //   users.forEach(user => {
        //     console.log(user.id)
        //   })
        //   resolve()
        // })
      }
    }
  })
  return User
}
