class UserDto {
    constructor(model) {
        this.id = model.id;
        this.name = model.name;
        this.surname = model.surname;
        this.email = model.email;
        this.image = model.image;
        this.isActivated = model.isActivated;
    }
}

module.exports = UserDto;