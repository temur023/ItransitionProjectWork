namespace Clean.Domain.Entities;

public class Item
{
        public int Id { get; set; }

        public int InventoryId { get; set; }
        public Inventory Inventory { get; set; }

        public string CustomId { get; set; }

        public int CreatedById { get; set; }
        public User CreatedBy { get; set; }

        public int UpdatedById { get; set; }
        public User UpdatedBy { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public int Version { get; set; }

        public ICollection<ItemFieldValue> FieldValues { get; set; }
        public ICollection<ItemLike> Likes { get; set; }
    }