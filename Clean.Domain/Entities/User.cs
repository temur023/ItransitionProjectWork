using Clean.Domain.Entities.Enums;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Runtime.Intrinsics.Arm;
using System.Text;

namespace Clean.Domain.Entities
{
    public class User
    {
        public int Id { get; set; }
        [MaxLength(60)]
        public string FullName { get; set; }
        [Required]
        public string Email { get; set; }
        public string PasswordHash { get; set; }
        public bool IsBlocked { get; set; }
        public UserRole Role { get; set; }
        public PreferedLanguage Language { get; set; }
        public PreferedTheme Theme{ get; set; }
    }
}
