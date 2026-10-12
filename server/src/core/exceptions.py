class NotFoundError(Exception): # Ошибка возникает, когда запрашиваемая сущность не найдена в базе данных.
    pass


class AlreadyExistsError(Exception): # Ошибка возникает, когда код пытается создать сущность, которая уже существует в базе данных.
    pass

class ValueError(Exception):
    pass
